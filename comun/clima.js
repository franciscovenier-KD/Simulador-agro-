/* Clima por localidad: busca la localidad, baja la serie diaria histórica
   (lluvia, ETo FAO, temperaturas) desde Open-Meteo y la guarda en caché local.
   La serie arranca el 1 de julio de 1994; el día 0 de cada campaña es el 1 de julio. */
(function () {
  var INICIO = "1994-07-01";
  var DIA0 = Date.UTC(1994, 6, 1);
  var MS = 86400000;
  var K_SERIE = "simagro.clima.";
  var K_LOC = "simagro.localidad";
  var K_IDX = "simagro.clima.indice";

  function leer(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function borrar(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function clave(loc) { return loc.lat.toFixed(2) + "," + loc.lon.toFixed(2); }

  async function buscar(texto) {
    texto = texto.trim();
    var m = texto.match(/^(-?\d+(?:[.,]\d+)?)\s*[,; ]\s*(-?\d+(?:[.,]\d+)?)$/);
    if (m) {
      var la = parseFloat(m[1].replace(",", ".")), lo = parseFloat(m[2].replace(",", "."));
      return [{ nombre: "Punto " + la.toFixed(2) + ", " + lo.toFixed(2), prov: "", pais: "", lat: la, lon: lo }];
    }
    var u = "https://geocoding-api.open-meteo.com/v1/search?count=8&language=es&name=" + encodeURIComponent(texto);
    var r = await fetch(u);
    if (!r.ok) throw new Error("El buscador de localidades no respondió");
    var j = await r.json();
    var res = (j.results || []).map(function (x) {
      return { nombre: x.name, prov: x.admin1 || "", pais: x.country || "", cc: x.country_code, lat: x.latitude, lon: x.longitude };
    });
    res.sort(function (a, b) { return (b.cc === "AR") - (a.cc === "AR"); });
    return res;
  }

  function limpiar(a, relleno) {
    var ult = relleno;
    return a.map(function (v) {
      if (v == null) return relleno === "previo" ? ult : 0;
      ult = v; return Math.round(v * 10) / 10;
    });
  }

  /* Devuelve {loc, hasta, lluvia[], eto[], tmax[], tmin[], desdeCache, aviso} */
  async function serie(loc) {
    var k = K_SERIE + clave(loc);
    var c = leer(k);
    var hoy = new Date();
    if (c && c.hasta && (hoy - new Date(c.hasta)) / MS < 30) { c.desdeCache = true; c.loc = loc; return c; }
    var fin = new Date(hoy.getTime() - 6 * MS);
    var u = "https://archive-api.open-meteo.com/v1/archive?latitude=" + loc.lat + "&longitude=" + loc.lon +
      "&start_date=" + INICIO + "&end_date=" + iso(fin) +
      "&daily=precipitation_sum,et0_fao_evapotranspiration,temperature_2m_max,temperature_2m_min&timezone=auto";
    try {
      var r = await fetch(u);
      if (!r.ok) throw new Error("HTTP " + r.status);
      var j = await r.json();
      var d = j.daily;
      var n = d.time.length;
      while (n > 0 && (d.precipitation_sum[n - 1] == null || d.et0_fao_evapotranspiration[n - 1] == null)) n--;
      var s = {
        hasta: d.time[n - 1],
        lluvia: limpiar(d.precipitation_sum.slice(0, n), 0),
        eto: limpiar(d.et0_fao_evapotranspiration.slice(0, n), "previo"),
        tmax: limpiar(d.temperature_2m_max.slice(0, n), "previo"),
        tmin: limpiar(d.temperature_2m_min.slice(0, n), "previo")
      };
      // caché: hasta 4 localidades
      var idx = leer(K_IDX) || [];
      idx = idx.filter(function (x) { return x !== k; }); idx.push(k);
      while (idx.length > 4) borrar(idx.shift());
      if (!guardar(k, s)) { idx.slice(0, -1).forEach(borrar); idx = [k]; guardar(k, s); }
      guardar(K_IDX, idx);
      s.loc = loc; s.desdeCache = false;
      return s;
    } catch (e) {
      if (c) { c.desdeCache = true; c.loc = loc; c.aviso = "Sin conexión con el servicio de clima: se usa la serie guardada hasta " + c.hasta + "."; return c; }
      throw new Error("No se pudo bajar el clima de esta localidad y no hay una copia guardada. Revisá la conexión a internet.");
    }
  }

  function indice(anio, mes, dia) { return Math.round((Date.UTC(anio, mes - 1, dia) - DIA0) / MS); }

  /* Campañas completas disponibles (año de inicio: 1 jul Y a 30 jun Y+1) */
  function campanias(s) {
    var out = [];
    for (var y = 1994; y < 2100; y++) {
      if (indice(y + 1, 6, 30) < s.lluvia.length) out.push(y); else break;
    }
    return out;
  }

  /* Datos de una campaña, día 0 = 1 de julio. Largo 365 o 366. */
  function campania(s, y) {
    var a = indice(y, 7, 1), b = indice(y + 1, 7, 1);
    return { anio: y, etiqueta: y + "/" + String(y + 1).slice(2), lluvia: s.lluvia.slice(a, b), eto: s.eto.slice(a, b), tmax: s.tmax.slice(a, b), tmin: s.tmin.slice(a, b) };
  }

  /* Clasifica campañas en seca / normal / húmeda por terciles de lluvia entre dos días de campaña */
  function clasificar(s, diaDesde, diaHasta) {
    var ys = campanias(s);
    var tot = ys.map(function (y) {
      var c = campania(s, y), t = 0;
      for (var i = diaDesde; i < Math.min(diaHasta, c.lluvia.length); i++) t += c.lluvia[i];
      return t;
    });
    var ord = tot.slice().sort(function (a, b) { return a - b; });
    var t1 = ord[Math.floor(ord.length / 3)], t2 = ord[Math.floor(2 * ord.length / 3)];
    var res = {};
    ys.forEach(function (y, i) { res[y] = { lluvia: Math.round(tot[i]), tipo: tot[i] < t1 ? "seca" : (tot[i] >= t2 ? "húmeda" : "normal") }; });
    return res;
  }

  function localidadGuardada() { return leer(K_LOC); }

  /* Monta el buscador en un contenedor. alListo(serie) se llama cada vez que hay clima cargado. */
  function montar(cont, alListo) {
    cont.innerHTML =
      '<div class="fila-buscar"><input type="search" class="loc-input" placeholder="Localidad (ej. Pergamino) o lat, long" aria-label="Localidad">' +
      '<button type="button" class="btn loc-btn">Buscar</button></div>' +
      '<div class="loc-res"></div><p class="loc-estado nota"></p>';
    var inp = cont.querySelector(".loc-input"), btn = cont.querySelector(".loc-btn"),
      res = cont.querySelector(".loc-res"), est = cont.querySelector(".loc-estado");

    async function cargar(loc) {
      res.innerHTML = "";
      est.className = "loc-estado nota";
      est.textContent = "Bajando el clima histórico de " + loc.nombre + "…";
      try {
        var s = await serie(loc);
        guardar(K_LOC, loc);
        var n = campanias(s).length;
        est.innerHTML = "<strong>" + loc.nombre + (loc.prov ? ", " + loc.prov : "") + "</strong> · " + n +
          " campañas (1994 a hoy) · datos hasta " + s.hasta.split("-").reverse().join("/") +
          ' · fuente: <a href="https://open-meteo.com/en/docs/historical-weather-api" target="_blank" rel="noopener">Open-Meteo, reanálisis ERA5</a>' +
          (s.aviso ? '<br><span class="alerta">' + s.aviso + "</span>" : "");
        inp.value = loc.nombre;
        alListo(s);
      } catch (e) {
        est.className = "loc-estado nota alerta";
        est.textContent = e.message;
      }
    }

    async function buscarYMostrar() {
      var t = inp.value.trim();
      if (!t) return;
      est.className = "loc-estado nota"; est.textContent = "Buscando…"; res.innerHTML = "";
      try {
        var r = await buscar(t);
        if (!r.length) { est.textContent = "No encontré esa localidad. Probá con otro nombre o con latitud, longitud."; return; }
        if (r.length === 1) return cargar(r[0]);
        est.textContent = "Elegí la localidad:";
        r.forEach(function (loc) {
          var b = document.createElement("button");
          b.type = "button"; b.className = "chip";
          b.textContent = loc.nombre + (loc.prov ? ", " + loc.prov : "") + (loc.pais ? " (" + loc.pais + ")" : "");
          b.onclick = function () { cargar(loc); };
          res.appendChild(b);
        });
      } catch (e) { est.className = "loc-estado nota alerta"; est.textContent = "No se pudo buscar la localidad. Revisá la conexión a internet."; }
    }
    btn.onclick = buscarYMostrar;
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") buscarYMostrar(); });

    var previa = localidadGuardada();
    if (previa) cargar(previa);
    else est.textContent = "Cargá tu localidad para empezar: todo el clima de la simulación sale de ahí.";
  }

  window.CLIMA = { buscar: buscar, serie: serie, campanias: campanias, campania: campania, clasificar: clasificar, montar: montar, localidadGuardada: localidadGuardada, indice: indice };
})();
