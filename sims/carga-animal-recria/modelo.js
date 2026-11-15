/* Modelo de recría pastoril. Lógica pura, sin DOM. Paso mensual.
   Los meses se indexan desde julio de 1994 (k = 0), igual que la serie de clima. */
(function (g) {
  var DIAS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function mesCal(k) { return (6 + k) % 12; }           // 0 = enero
  function anioDe(k) { return 1994 + Math.floor((6 + k) / 12); }
  function kDe(anio, mes) { return (anio - 1994) * 12 + mes - 6; }

  /* Factor climático mensual: agua disponible del mes respecto de lo normal de ese mes en la localidad. */
  function factores(lluvia, eto, cap) {
    cap = cap || 150;
    var W = cap * 0.6, q = [], ll = [], completo = [], a = 0, c = 0, l = 0, nd = 0;
    var d = new Date(Date.UTC(1994, 6, 1)), mes = 6;
    for (var i = 0; i < lluvia.length; i++) {
      var m = d.getUTCMonth();
      if (m !== mes) { q.push(c > 0 ? a / c : 1); ll.push(l); completo.push(true); a = c = l = nd = 0; mes = m; }
      W = Math.min(cap, W + lluvia[i]);
      var etc = 0.95 * eto[i], ks = W > 0.5 * cap ? 1 : W / (0.5 * cap), eta = Math.min(W, ks * etc);
      W -= eta; a += eta; c += etc; l += lluvia[i]; nd++;
      d.setUTCDate(d.getUTCDate() + 1);
    }
    var sum = new Array(12).fill(0), cnt = new Array(12).fill(0);
    q.forEach(function (v, k) { sum[mesCal(k)] += v; cnt[mesCal(k)]++; });
    var f = q.map(function (v, k) { var nrm = sum[mesCal(k)] / cnt[mesCal(k)]; return Math.max(0.2, Math.min(1.4, nrm > 0 ? v / nrm : 1)); });
    return { f: f, lluvia: ll, meses: q.length };
  }

  /* F: salida de factores(). k0: mes de entrada.
     p: {carga (cab/ha), mezcla: [{curva[12], em, frac}], nivel (1 = curva de referencia), pesoEntrada, pesoVenta, maxMeses,
         supl: {modo: 'nunca'|'deficit'|'invierno', kg}, aprov, perdida, stockInicial, stockMax, emMaiz, sustitucion} */
  function simular(F, k0, p) {
    var pv = p.pesoEntrada, S = p.stockInicial, meses = [], deficit = 0, suplTotal = 0, dias = 0;
    for (var j = 0; j < p.maxMeses; j++) {
      var k = k0 + j;
      if (k >= F.meses) return null;                      // no hay clima para completar el ciclo
      var mc = mesCal(k), nd = DIAS[mc], fc = F.f[k];
      var G = 0, emNum = 0, emDen = 0;
      p.mezcla.forEach(function (r) {
        var gr = r.frac * r.curva[mc] * nd * fc * p.nivel;
        G += gr; emNum += gr * r.em; emDen += gr;
      });
      var em = emDen > 0 ? emNum / emDen : p.mezcla.reduce(function (s, r) { return s + r.frac * r.em; }, 0);
      var consumoPct = (2.2 + (em - 2.0)) / 100;
      var demCab = pv * consumoPct;                        // kg MS/cab/día que comería a voluntad
      var ofertaCab = (S + G) * p.aprov / p.carga / nd;    // kg MS/cab/día que el campo puede dar
      var falta = ofertaCab < demCab * 0.95;
      var sup = 0;
      if (p.supl.modo === "invierno" && mc >= 4 && mc <= 7) sup = p.supl.kg;
      if (p.supl.modo === "deficit" && falta) sup = p.supl.kg;
      var pasto = Math.min(ofertaCab, Math.max(0, demCab - (falta ? 0 : p.sustitucion * sup)));
      if (falta) pasto = Math.min(ofertaCab, demCab);
      var emIng = pasto * em + sup * p.emMaiz;
      var mant = 0.135 * Math.pow(pv, 0.75);
      var saldo = emIng - mant;
      var adg = saldo >= 0 ? Math.min(1.1, saldo / (6 + 0.02 * pv)) : Math.max(-0.4, saldo / 6);
      var comido = pasto * p.carga * nd;
      S = Math.min(p.stockMax, Math.max(0, (S + G - comido) * (1 - p.perdida)));
      if (falta) deficit++;
      suplTotal += sup * nd; dias += nd;
      pv += adg * nd;
      meses.push({ k: k, mes: mc, anio: anioDe(k), crecimiento: G, oferta: ofertaCab * p.carga * nd, demanda: demCab * p.carga * nd, comido: comido, adg: adg, pv: pv, stock: S, falta: falta, sup: sup, clima: fc });
      if (pv >= p.pesoVenta) break;
    }
    return {
      meses: meses, pesoFinal: pv, duracion: meses.length, dias: dias, llego: pv >= p.pesoVenta,
      mesesDeficit: deficit, suplCab: suplTotal, adg: (pv - p.pesoEntrada) / dias,
      kgHa: (pv - p.pesoEntrada) * p.carga, kgHaAnio: (pv - p.pesoEntrada) * p.carga * 365 / dias
    };
  }

  /* ec en USD: {ternero, novillito, novillitoPesado, novillo (USD/kg vivo), maiz (USD/t), comercPct, sanidad, mortandadPct, costoForrajeHa (USD/ha/año)} */
  function economia(res, p, ec) {
    var precioVenta = res.pesoFinal <= 390 ? ec.novillito : res.pesoFinal <= 430 ? ec.novillitoPesado : ec.novillo;
    var compra = p.pesoEntrada * ec.ternero * (1 + ec.comercPct / 100);
    var venta = res.pesoFinal * precioVenta * (1 - ec.comercPct / 100) * (1 - ec.mortandadPct / 100);
    var supl = res.suplCab / 0.88 * ec.maiz / 1000;
    var porCab = venta - compra - supl - ec.sanidad;
    var forraje = ec.costoForrajeHa * res.dias / 365;
    var margenCiclo = porCab * p.carga - forraje;
    return {
      precioVenta: precioVenta, compra: compra, venta: venta, supl: supl, porCab: porCab, forraje: forraje,
      margenCiclo: margenCiclo, margenAnio: margenCiclo * 365 / res.dias, capitalHa: compra * p.carga
    };
  }

  g.MODELO_RECRIA = { factores: factores, simular: simular, economia: economia, kDe: kDe, mesCal: mesCal, anioDe: anioDe };
})(typeof window !== "undefined" ? window : this);
