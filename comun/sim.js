/* Utilidades compartidas por todas las simulaciones. */
(function () {
  var MS = 86400000;
  function leer(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function num(n, dec) {
    if (n == null || !isFinite(n)) return "s/d";
    return n.toLocaleString("es-AR", { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
  }
  function fecha(isoStr) { return isoStr ? isoStr.slice(0, 10).split("-").reverse().join("/") : "s/f"; }
  function diasDesde(isoStr) { return Math.floor((Date.now() - new Date(isoStr).getTime()) / MS); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- Precios: referencia (precios.js) + valor propio del usuario ---------- */
  var K_PROPIOS = "simagro.precios.propios";
  var propios = leer(K_PROPIOS) || {};

  function precio(clave) {
    var it = window.PRECIOS.items[clave];
    if (!it) throw new Error("Falta el precio " + clave + " en comun/precios.js");
    var p = propios[clave];
    return { clave: clave, item: it, valor: p != null ? p : it.valor, propio: p != null, viejo: diasDesde(it.fecha) > it.vigenciaDias, dias: diasDesde(it.fecha) };
  }
  function fijarPropio(clave, v) {
    if (v == null || isNaN(v)) delete propios[clave]; else propios[clave] = v;
    guardar(K_PROPIOS, propios);
  }

  /* Dólar mayorista en vivo; si falla queda el de precios.js con su fecha. */
  async function actualizarDolar() {
    try {
      var r = await fetch("https://dolarapi.com/v1/dolares/mayorista");
      if (!r.ok) throw 0;
      var j = await r.json();
      if (j && j.venta > 0) {
        var it = window.PRECIOS.items.dolar_mayorista;
        it.valor = j.venta; it.fecha = j.fechaActualizacion.slice(0, 10);
        it.fuente = "DolarApi, en vivo"; it.enVivo = true;
        return true;
      }
    } catch (e) {}
    return false;
  }

  /* Panel de precios editable. claves: lista; alCambiar: callback. */
  function panelPrecios(cont, claves, alCambiar) {
    function pintar() {
      cont.innerHTML = "";
      claves.forEach(function (c) {
        var p = precio(c), it = p.item;
        var f = document.createElement("div"); f.className = "precio-fila";
        var etq = p.propio ? '<span class="etq tuyo">valor tuyo</span>' :
          (p.viejo ? '<span class="etq viejo">desactualizado: ' + p.dias + " días</span>" : '<span class="etq ok">' + (it.enVivo ? "en vivo" : "vigente") + "</span>");
        f.innerHTML = '<div class="nom">' + esc(it.nombre) + " <small>(" + esc(it.unidad) + ")</small></div>" +
          '<input type="number" step="any" value="' + p.valor + '" aria-label="' + esc(it.nombre) + '">' +
          '<div class="meta">' + etq + "Referencia: " + num(it.valor, it.valor < 100 ? 2 : 0) + " al " + fecha(it.fecha) +
          ' · <a href="' + esc(it.url) + '" target="_blank" rel="noopener">' + esc(it.fuente) + "</a>" +
          (p.propio ? ' · <button type="button" class="btn sec mini">volver a la referencia</button>' : "") + "</div>";
        f.querySelector("input").addEventListener("change", function (e) {
          var v = parseFloat(e.target.value);
          fijarPropio(c, (isNaN(v) || v === it.valor) ? null : v);
          pintar(); alCambiar();
        });
        var b = f.querySelector("button");
        if (b) b.onclick = function () { fijarPropio(c, null); pintar(); alCambiar(); };
        cont.appendChild(f);
      });
    }
    pintar();
    return pintar;
  }

  /* ---------- Rutas guardadas (máx. 3 por simulación) ---------- */
  function rutas(simId) {
    var k = "simagro.rutas." + simId;
    return {
      lista: function () { return leer(k) || []; },
      agregar: function (r) { var l = leer(k) || []; if (l.length >= 3) return false; l.push(r); guardar(k, l); return true; },
      quitar: function (i) { var l = leer(k) || []; l.splice(i, 1); guardar(k, l); }
    };
  }

  /* ---------- Estadística ---------- */
  function cuantil(arr, q) {
    var a = arr.slice().sort(function (x, y) { return x - y; });
    if (!a.length) return NaN;
    var p = (a.length - 1) * q, b = Math.floor(p);
    return a[b] + (a[Math.min(b + 1, a.length - 1)] - a[b]) * (p - b);
  }
  function media(arr) { return arr.reduce(function (s, v) { return s + v; }, 0) / (arr.length || 1); }

  /* ---------- Finanzas ---------- */
  function van(inversion, flujoAnual, anios, tasa) {
    var v = -inversion;
    for (var t = 1; t <= anios; t++) v += flujoAnual / Math.pow(1 + tasa, t);
    return v;
  }
  function tir(inversion, flujoAnual, anios) {
    if (flujoAnual * anios <= inversion) return null;
    var lo = 0, hi = 5;
    for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (van(inversion, flujoAnual, anios, m) > 0) lo = m; else hi = m; }
    return lo;
  }

  /* ---------- Gráficos SVG ---------- */
  function ejeY(min, max, n) {
    var paso = Math.pow(10, Math.floor(Math.log10((max - min) / n || 1)));
    var cand = [1, 2, 5, 10].map(function (m) { return m * paso; });
    var p = cand.filter(function (c) { return (max - min) / c <= n; })[0] || cand[3];
    var t = [];
    for (var v = Math.ceil(min / p) * p; v <= max + 1e-9; v += p) t.push(Math.round(v * 1e6) / 1e6);
    return t;
  }

  /* Barras por categoría. items: [{etq, valor, color, titulo}], op: {alto, unidad, alClic(i), sel} */
  function barras(cont, items, op) {
    op = op || {};
    var W = 720, H = op.alto || 240, mi = 46, md = 8, ms = 10, mb = 30;
    var vals = items.map(function (d) { return d.valor; });
    var mn = Math.min(0, Math.min.apply(null, vals)), mx = Math.max(0, Math.max.apply(null, vals));
    if (mx === mn) mx = mn + 1;
    var y = function (v) { return ms + (H - ms - mb) * (1 - (v - mn) / (mx - mn)); };
    var bw = (W - mi - md) / items.length;
    var s = '<svg class="graf" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(op.titulo || "gráfico de barras") + '">';
    ejeY(mn, mx, 5).forEach(function (t) {
      s += '<line x1="' + mi + '" x2="' + (W - md) + '" y1="' + y(t) + '" y2="' + y(t) + '" stroke="var(--borde)" stroke-width="' + (t === 0 ? 1.5 : .6) + '"/>' +
        '<text x="' + (mi - 6) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + num(t) + "</text>";
    });
    var cada = Math.ceil(items.length / 16);
    items.forEach(function (d, i) {
      var x = mi + i * bw, y0 = y(0), y1 = y(d.valor);
      s += '<rect data-i="' + i + '" x="' + (x + bw * .12) + '" y="' + Math.min(y0, y1) + '" width="' + (bw * .76) + '" height="' + Math.max(1, Math.abs(y1 - y0)) +
        '" rx="2" fill="' + d.color + '"' + (op.sel === i ? ' stroke="var(--tinta)" stroke-width="2"' : "") + (op.alClic ? ' style="cursor:pointer"' : "") + "><title>" + esc(d.titulo || "") + "</title></rect>";
      if (i % cada === 0) s += '<text x="' + (x + bw / 2) + '" y="' + (H - 10) + '" text-anchor="middle">' + esc(d.etq) + "</text>";
    });
    if (op.unidad) s += '<text x="4" y="10">' + esc(op.unidad) + "</text>";
    s += "</svg>";
    cont.innerHTML = s;
    if (op.alClic) cont.querySelectorAll("rect[data-i]").forEach(function (r) { r.addEventListener("click", function () { op.alClic(+r.getAttribute("data-i")); }); });
  }

  /* Series en el tiempo. series: [{datos:[], color, tipo:'linea'|'area'|'barra', eje:'izq'|'der'}], op: {alto, etqX:[{i, t}], maxIzq, maxDer, unidadIzq, unidadDer, bandas:[{desde,hasta,color}]} */
  function series(cont, sr, op) {
    op = op || {};
    var W = 720, H = op.alto || 260, mi = 40, md = 40, ms = 14, mb = 26;
    var n = sr[0].datos.length;
    var mxI = op.maxIzq || Math.max.apply(null, sr.filter(function (s) { return s.eje !== "der"; }).map(function (s) { return Math.max.apply(null, s.datos); })) || 1;
    var der = sr.filter(function (s) { return s.eje === "der"; });
    var mxD = op.maxDer || (der.length ? Math.max.apply(null, der.map(function (s) { return Math.max.apply(null, s.datos); })) : 1) || 1;
    var x = function (i) { return mi + (W - mi - md) * i / Math.max(1, n - 1); };
    var yI = function (v) { return ms + (H - ms - mb) * (1 - v / mxI); };
    var yD = function (v) { return ms + (H - ms - mb) * (1 - v / mxD); };
    var s = '<svg class="graf" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(op.titulo || "gráfico") + '">';
    (op.bandas || []).forEach(function (b) {
      s += '<rect x="' + x(b.desde) + '" y="' + ms + '" width="' + (x(b.hasta) - x(b.desde)) + '" height="' + (H - ms - mb) + '" fill="' + b.color + '" opacity=".13"/>' +
        (b.t ? '<text x="' + ((x(b.desde) + x(b.hasta)) / 2) + '" y="' + (ms + 11) + '" text-anchor="middle">' + esc(b.t) + "</text>" : "");
    });
    ejeY(0, mxI, 4).forEach(function (t) {
      s += '<line x1="' + mi + '" x2="' + (W - md) + '" y1="' + yI(t) + '" y2="' + yI(t) + '" stroke="var(--borde)" stroke-width=".6"/><text x="' + (mi - 5) + '" y="' + (yI(t) + 4) + '" text-anchor="end">' + num(t) + "</text>";
    });
    if (der.length) ejeY(0, mxD, 4).forEach(function (t) { s += '<text x="' + (W - md + 5) + '" y="' + (yD(t) + 4) + '">' + num(t) + "</text>"; });
    sr.forEach(function (q) {
      var y = q.eje === "der" ? yD : yI;
      if (q.tipo === "barra") {
        var bw = Math.max(1.2, (W - mi - md) / n * .8);
        q.datos.forEach(function (v, i) { if (v > 0) s += '<rect x="' + (x(i) - bw / 2) + '" y="' + y(v) + '" width="' + bw + '" height="' + (y(0) - y(v)) + '" fill="' + q.color + '"/>'; });
      } else {
        var pts = q.datos.map(function (v, i) { return x(i).toFixed(1) + "," + y(v).toFixed(1); }).join(" ");
        if (q.tipo === "area") s += '<polygon points="' + x(0) + "," + y(0) + " " + pts + " " + x(n - 1) + "," + y(0) + '" fill="' + q.color + '" opacity=".25"/>';
        s += '<polyline points="' + pts + '" fill="none" stroke="' + q.color + '" stroke-width="' + (q.grosor || 1.8) + '"' + (q.punteada ? ' stroke-dasharray="5 4"' : "") + "/>";
      }
    });
    (op.etqX || []).forEach(function (e) { s += '<text x="' + x(e.i) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(e.t) + "</text>"; });
    if (op.unidadIzq) s += '<text x="2" y="10">' + esc(op.unidadIzq) + "</text>";
    if (op.unidadDer) s += '<text x="' + (W - 2) + '" y="10" text-anchor="end">' + esc(op.unidadDer) + "</text>";
    s += "</svg>";
    cont.innerHTML = s;
  }

  function colorTipo(t) { return t === "seca" ? "var(--seca)" : (t === "húmeda" ? "var(--humeda)" : "var(--normal)"); }

  /* Lista de fuentes a partir de un objeto de parámetros {clave: {nombre, valor, unidad, fuente, url, tipo}} */
  function listaFuentes(cont, params) {
    var h = "<ul>";
    Object.keys(params).forEach(function (k) {
      var p = params[k];
      var v = typeof p.valor === "object" ? "" : " = " + p.valor + " " + (p.unidad || "");
      h += "<li><strong>" + esc(p.nombre) + "</strong>" + esc(v) + ". " +
        (p.tipo === "supuesto" ? '<span class="etq tuyo">supuesto ajustable</span> ' : "") +
        (p.url ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.fuente) + "</a>" : esc(p.fuente || "")) + "</li>";
    });
    cont.innerHTML = h + "</ul>";
  }

  window.SIM = {
    num: num, fecha: fecha, esc: esc, diasDesde: diasDesde, leer: leer, guardar: guardar,
    precio: precio, panelPrecios: panelPrecios, actualizarDolar: actualizarDolar,
    rutas: rutas, cuantil: cuantil, media: media, van: van, tir: tir,
    barras: barras, series: series, colorTipo: colorTipo, listaFuentes: listaFuentes
  };
})();
