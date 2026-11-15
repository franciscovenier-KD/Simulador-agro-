#!/usr/bin/env python3
"""Actualiza comun/precios.js leyendo las fuentes públicas de precios.

Lo corre la GitHub Action todos los días hábiles. Solo usa la biblioteca estándar.

Reglas:
- Nunca se inventa un valor: si una fuente no responde o no se puede leer, el ítem queda como está
  (el sitio lo marca solo como desactualizado cuando supera su vigencia).
- No se pisa un dato con otro más viejo.
- Si un precio salta más de 15 % contra el anterior, no se escribe y se avisa para revisarlo a mano.
- La urea y los costos de riego no tienen una fuente fija legible por script: los mantiene la tarea de Claude.
"""
import datetime
import html
import json
import pathlib
import re
import sys
import urllib.request

RAIZ = pathlib.Path(__file__).resolve().parent.parent
ARCHIVO = RAIZ / "comun" / "precios.js"
UA = "Mozilla/5.0 (compatible; simulador-agro-precios/1.0)"
SALTO_MAX = 0.15

URL_BCR = "https://www.cac.bcr.com.ar/es/precios-de-pizarra"
URL_AGROFY = "https://news.agrofy.com.ar/mercado-ganadero"
URL_DOLAR = "https://dolarapi.com/v1/dolares/mayorista"


def bajar(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "es-AR,es"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8", errors="ignore")


def a_texto(pagina):
    """Quita scripts y etiquetas; separa los textos con |."""
    s = re.sub(r"(?s)<(script|style)[^>]*>.*?</\1>", " ", pagina)
    s = re.sub(r"<[^>]+>", "|", s)
    s = html.unescape(s)
    s = re.sub(r"\s+", " ", s)
    return re.sub(r"(\|\s*)+", "|", s)


def numero(txt):
    """'275.800,00' -> 275800.0"""
    return float(txt.replace(".", "").replace(",", "."))


def fecha_iso(txt):
    """'12/11/2026' -> '2026-11-12'"""
    d, m, a = txt.split("/")
    return "%s-%s-%s" % (a, m.zfill(2), d.zfill(2))


def leer_bcr():
    t = a_texto(bajar(URL_BCR))
    f = re.search(r"Precios Pizarra del d[ií]a\s*(\d{1,2}/\d{1,2}/\d{4})", t)
    m = re.search(r"\|\s*Ma[ií]z\s*\|\s*\$\s*([\d.]+,\d{2})\s*\|", t)   # si figura S/C (sin cotización) no coincide
    if not (f and m):
        raise ValueError("no se encontró la pizarra de maíz (puede figurar sin cotización)")
    return {"maiz_pizarra_rosario": (numero(m.group(1)), fecha_iso(f.group(1)))}


def leer_agrofy():
    t = a_texto(bajar(URL_AGROFY))
    out = {}
    m = re.search(r"\|INMAG\|\$\|([\d.]+,\d{2})\|.{0,80}?(\d{2}/\d{2}/\d{4})", t)
    if m:
        out["novillo_inmag"] = (numero(m.group(1)), fecha_iso(m.group(2)))
    m = re.search(r"\|[IÍ]ndice Ternero\|\$\|([\d.]+,\d{2})\|.{0,80}?(\d{2}/\d{2}/\d{4})", t)
    if m:
        out["ternero_rosgan"] = (numero(m.group(1)), fecha_iso(m.group(2)))
    f = re.search(r"Fecha del remate:\s*(\d{2}/\d{2}/\d{4})", t)
    if f:
        fila = r"\|\d+\|[\d.]+,\d{2}\|[\d.]+,\d{2}\|([\d.]+,\d{2})\|"   # cabezas | mín | máx | promedio
        for clave, cat in (("novillito_canuelas", r"Novillitos espec\. hasta 390 kg\."),
                           ("novillito_pesado_canuelas", r"Novillitos espec\. m[aá]s de 390 kg\.")):
            m = re.search(cat + fila, t)
            if m:
                out[clave] = (numero(m.group(1)), fecha_iso(f.group(1)))
    if not out:
        raise ValueError("no se encontró ningún precio de hacienda")
    return out


def leer_dolar():
    j = json.loads(bajar(URL_DOLAR))
    return {"dolar_mayorista": (float(j["venta"]), j["fechaActualizacion"][:10])}


def bloque(js, clave):
    """Devuelve el match con (antes, valor, medio, fecha, comilla) del ítem."""
    return re.search(r"(\b%s:\s*\{.*?valor:\s*)([\d.]+)(.*?fecha:\s*\")(\d{4}-\d{2}-\d{2})(\")" % re.escape(clave), js, re.S)


def main():
    js = ARCHIVO.read_text(encoding="utf-8")
    nuevos, avisos = {}, []
    for nombre, lector in (("BCR pizarra", leer_bcr), ("Agrofy hacienda", leer_agrofy), ("DolarApi", leer_dolar)):
        try:
            nuevos.update(lector())
        except Exception as e:  # una fuente caída no frena a las demás
            avisos.append("FUENTE SIN DATO: %s (%s)" % (nombre, e))

    cambios = 0
    for clave, (valor, fecha) in sorted(nuevos.items()):
        m = bloque(js, clave)
        if not m:
            avisos.append("NO EXISTE en precios.js: %s" % clave)
            continue
        viejo, fecha_vieja = float(m.group(2)), m.group(4)
        if valor <= 0 or fecha < fecha_vieja:
            print("  %-28s sin cambio (dato leído del %s, no es más nuevo que %s)" % (clave, fecha, fecha_vieja))
            continue
        if valor == viejo and fecha == fecha_vieja:
            print("  %-28s sin cambio (%s al %s)" % (clave, viejo, fecha))
            continue
        if abs(valor - viejo) / viejo > SALTO_MAX:
            avisos.append("SALTO SOSPECHOSO en %s: %s -> %s (%s). No se escribió; revisar a mano." % (clave, viejo, valor, fecha))
            continue
        txt = ("%.2f" % valor).rstrip("0").rstrip(".")
        js = js[:m.start()] + m.group(1) + txt + m.group(3) + fecha + m.group(5) + js[m.end():]
        cambios += 1
        print("  %-28s %s (%s) -> %s (%s)" % (clave, viejo, fecha_vieja, txt, fecha))

    if nuevos:  # el robot corrió y al menos una fuente respondió
        hoy = (datetime.datetime.utcnow() - datetime.timedelta(hours=3)).strftime("%Y-%m-%d")
        js = re.sub(r'(actualizado:\s*")\d{4}-\d{2}-\d{2}(")', r"\g<1>%s\g<2>" % hoy, js, count=1)
    ARCHIVO.write_text(js, encoding="utf-8")

    print("%d precio(s) actualizado(s)." % cambios)
    for a in avisos:
        print("AVISO: " + a)
    # falla (y GitHub avisa por mail) solo si ninguna fuente respondió
    return 1 if not nuevos else 0


if __name__ == "__main__":
    sys.exit(main())
