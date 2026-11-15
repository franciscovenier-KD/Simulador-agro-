/* Modelo de maíz con y sin riego. Lógica pura, sin DOM.
   Balance hídrico diario FAO-56 (Kc único) + respuesta del rinde FAO-33 por etapa. */
(function (g) {
  /* camp: {lluvia[], eto[]} con día 0 = 1 de julio.
     p: {awc (mm/m), prof (m), siembra:{dia, ciclo}, ypot (t/ha), nKg, nSuelo, nPorTon,
         riego:{on, lamina, umbral (0-1 de agotamiento del agua útil), capacidad (mm/día), eficiencia, tope (mm)},
         kc, etapas, pAgot, ky, escurr, perfilInicial} */
  function simular(camp, p) {
    var n = camp.lluvia.length;
    var tawTot = p.awc * p.prof;
    var W = tawTot * p.perfilInicial;            // agua útil almacenada en todo el perfil
    var s0 = p.siembra.dia, L = p.siembra.ciclo, fin = Math.min(n - 1, s0 + L);
    var e = p.etapas, dIni = L * e.ini, dDes = L * (e.ini + e.des), dMed = L * (e.ini + e.des + e.med);
    var cortes = { veg: 0.40 * L, flor: 0.55 * L, llen: 0.85 * L };
    var acc = { veg: [0, 0], flor: [0, 0], llen: [0, 0], mad: [0, 0] };
    var diario = { agua: [], lluvia: [], riego: [], umbralEstres: [], capacidad: [] };
    var regado = 0, pasadas = 0, ultRiego = -99, lluviaCiclo = 0, etc = 0, eta = 0, diasEstres = 0;
    var r = p.riego || { on: false };

    for (var d = 0; d <= fin; d++) {
      var lluvia = camp.lluvia[d] || 0, eto = camp.eto[d] || 0;
      var ef = lluvia > 15 ? lluvia - p.escurr * (lluvia - 15) : lluvia;
      var riegoHoy = 0, t = d - s0;
      var zr = p.prof, kc = 0.30, enCultivo = t >= 0;

      if (enCultivo) {
        zr = t >= dDes ? p.prof : Math.min(p.prof, 0.30 + (p.prof - 0.30) * t / dDes);
        kc = t < dIni ? p.kc.ini : t < dDes ? p.kc.ini + (p.kc.med - p.kc.ini) * (t - dIni) / (dDes - dIni)
          : t < dMed ? p.kc.med : p.kc.med + (p.kc.fin - p.kc.med) * (t - dMed) / (L - dMed);
        lluviaCiclo += lluvia;
      }
      var taw = p.awc * zr;                       // agua útil total en la zona de raíces
      var wr = W * zr / p.prof;                   // agua útil presente en la zona de raíces
      var raw = p.pAgot * taw;

      // decisión de riego
      if (enCultivo && r.on && t < cortes.llen) {
        var agot = (taw - wr) / taw;
        var espera = r.lamina / r.capacidad;
        if (agot > r.umbral && d - ultRiego >= espera && regado + r.lamina <= (r.tope || 1e9)) {
          riegoHoy = r.lamina; regado += r.lamina; pasadas++; ultRiego = d;
        }
      }
      W = Math.min(tawTot, W + ef + riegoHoy * (r.eficiencia || 1));
      wr = W * zr / p.prof;

      var ks, etcHoy, etaHoy;
      if (enCultivo) {
        var dr = taw - wr;
        ks = dr > raw ? Math.max(0, (taw - dr) / (taw - raw)) : 1;
        etcHoy = kc * eto; etaHoy = ks * etcHoy;
        etc += etcHoy; eta += etaHoy;
        if (ks < 0.95) diasEstres++;
        var et = t < cortes.veg ? "veg" : t < cortes.flor ? "flor" : t < cortes.llen ? "llen" : "mad";
        acc[et][0] += etaHoy; acc[et][1] += etcHoy;
      } else {
        ks = Math.min(1, W / (0.5 * tawTot));     // barbecho: evaporación que cae al secarse el perfil
        etaHoy = 0.30 * eto * ks;
      }
      W = Math.max(0, W - etaHoy);

      diario.agua.push(W * zr / p.prof);
      diario.capacidad.push(taw);
      diario.umbralEstres.push(taw - raw);
      diario.lluvia.push(lluvia);
      diario.riego.push(riegoHoy);
    }

    var rel = 1, porEtapa = {};
    ["veg", "flor", "llen", "mad"].forEach(function (k) {
      var q = acc[k][1] > 0 ? acc[k][0] / acc[k][1] : 1;
      porEtapa[k] = q;
      rel *= Math.max(0, 1 - p.ky[k] * (1 - q));
    });
    var rindeAgua = p.ypot * rel;
    var rindeN = (p.nSuelo + p.nKg) / p.nPorTon;
    var rinde = Math.min(rindeAgua, rindeN);
    return {
      rinde: rinde, rindeAgua: rindeAgua, rindeN: rindeN, limita: rindeN < rindeAgua ? "nitrógeno" : "agua",
      relAgua: rel, porEtapa: porEtapa, regado: regado, pasadas: pasadas, lluviaCiclo: lluviaCiclo,
      etc: etc, eta: eta, diasEstres: diasEstres, diario: diario, siembra: s0, fin: fin, cortes: cortes
    };
  }

  /* ec: {precioMaiz (USD/t), urea (USD/t), costoBase (USD/ha), cosechaComercPct, costoMm (USD/mm/ha)} */
  function economia(res, p, ec) {
    var ingreso = res.rinde * ec.precioMaiz;
    var comerc = ingreso * ec.cosechaComercPct / 100;
    var nitro = p.nKg / 0.46 * ec.urea / 1000;
    var riego = res.regado * ec.costoMm;
    var costos = ec.costoBase + nitro + comerc + riego;
    return { ingreso: ingreso, comerc: comerc, nitro: nitro, riego: riego, base: ec.costoBase, costos: costos, margen: ingreso - costos };
  }

  g.MODELO_RIEGO = { simular: simular, economia: economia };
})(typeof window !== "undefined" ? window : this);
