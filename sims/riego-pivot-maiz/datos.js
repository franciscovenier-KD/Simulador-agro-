/* Parámetros técnicos de la simulación "Riego por pivot en maíz".
   tipo "fuente": dato publicado. tipo "supuesto": valor de trabajo, ajustable, sin fuente única.
   Los precios NO van acá: van en comun/precios.js (se actualizan solos). */
window.DATOS_RIEGO = {
  consultado: "2026-11-15",
  params: {
    kc: {
      nombre: "Coeficiente de cultivo Kc del maíz (inicial / medio / final)",
      valor: { ini: 0.35, med: 1.20, fin: 0.55 }, tipo: "fuente",
      fuente: "FAO Riego y Drenaje 56, tabla 12 (Kc inicial 0,3; medio 1,20; final 0,35 a 0,60)",
      url: "https://www.fao.org/4/x0490s/x0490s00.htm"
    },
    etapas: {
      nombre: "Duración relativa de etapas (inicial 20 %, desarrollo 27 %, media 33 %, final 20 %)",
      valor: { ini: 0.20, des: 0.27, med: 0.33, fin: 0.20 }, tipo: "fuente",
      fuente: "FAO 56, tabla 11, maíz grano 30/40/50/30 días",
      url: "https://www.fao.org/4/x0490s/x0490s00.htm"
    },
    p: {
      nombre: "Fracción de agotamiento sin estrés (p)", valor: 0.55, unidad: "", tipo: "fuente",
      fuente: "FAO 56, tabla 22, maíz", url: "https://www.fao.org/4/x0490s/x0490s00.htm"
    },
    ky: {
      nombre: "Respuesta del rinde al déficit hídrico Ky (vegetativo 0,4; floración 1,5; llenado 0,5; madurez 0,2)",
      valor: { veg: 0.4, flor: 1.5, llen: 0.5, mad: 0.2 }, tipo: "fuente",
      fuente: "FAO Riego y Drenaje 33 (Doorenbos y Kassam), maíz", url: "https://www.fao.org/4/x0490s/x0490s0e.htm"
    },
    suelos: {
      nombre: "Agua útil por textura (mm por metro de suelo)",
      valor: { "Arenoso franco": 90, "Franco arenoso": 130, "Franco": 155, "Franco limoso": 170, "Franco arcillo limoso": 160, "Arcilloso": 150 },
      tipo: "fuente", fuente: "FAO 56, tabla 19 (punto medio de cada rango)", url: "https://www.fao.org/4/x0490s/x0490s00.htm"
    },
    siembra: {
      nombre: "Fechas y ciclos: temprana 1 de octubre, 150 días; tardía 1 de diciembre, 140 días",
      valor: { temprana: { dia: 92, ciclo: 150 }, tardia: { dia: 153, ciclo: 140 } }, tipo: "supuesto",
      fuente: "Fechas típicas de la región pampeana; ajustar a la zona"
    },
    ypot: {
      nombre: "Rinde alcanzable sin límite de agua (t/ha): temprana 15,5; tardía 13,5",
      valor: { temprana: 15.5, tardia: 13.5 }, tipo: "supuesto",
      fuente: "Referencia: maíz bajo riego promedió 14.890 kg/ha en INTA Manfredi (2026). Editable en la simulación.",
      url: "https://www.argentina.gob.ar/noticias/cuanto-cuesta-incorporar-riego-tras-la-aprobacion-del-rimi-0"
    },
    nPorTon: {
      nombre: "Nitrógeno disponible (suelo + fertilizante) por tonelada de grano", valor: 17, unidad: "kg N/t", tipo: "supuesto",
      fuente: "Regla práctica de planteos pampeanos (umbral de 150 a 170 kg N/ha para unas 10 t). Contrastar con el análisis de suelo."
    },
    nSuelo: {
      nombre: "Nitrógeno de nitratos en el suelo a la siembra (0-60 cm)", valor: 60, unidad: "kg N/ha", tipo: "supuesto",
      fuente: "Valor típico; reemplazar por el del análisis de suelo"
    },
    eficiencia: {
      nombre: "Eficiencia de aplicación del pivot", valor: 0.85, unidad: "", tipo: "supuesto",
      fuente: "Rango habitual de pivot central: 80 a 90 %"
    },
    escurrimiento: {
      nombre: "Escurrimiento: se pierde el 25 % de lo que una lluvia diaria supera los 15 mm", valor: 0.25, unidad: "", tipo: "supuesto",
      fuente: "Simplificación; depende de pendiente, cobertura e intensidad"
    },
    perfilInicial: {
      nombre: "Agua útil en el perfil al 1 de julio", valor: 0.5, unidad: "(fracción)", tipo: "supuesto",
      fuente: "Punto de partida del barbecho; desde ahí el perfil se recarga con la lluvia real de cada año"
    },
    costoBase: {
      nombre: "Costos directos sin nitrógeno, cosecha ni comercialización", valor: 490, unidad: "USD/ha", tipo: "supuesto",
      fuente: "Calibrado para reproducir los 935 USD/ha de costo directo de maíz en secano de INTA Manfredi (mayo 2026). Editable.",
      url: "https://www.infocampo.com.ar/tras-la-aprobacion-del-rimi-cuanto-cuesta-incorporar-riego-en-un-campo-tradicional/"
    },
    cosechaComerc: {
      nombre: "Cosecha + flete + comercialización, como % del ingreso", valor: 25, unidad: "%", tipo: "supuesto",
      fuente: "Cosecha cerca de 8 %, comercialización y flete cerca de 17 %; depende de la distancia a puerto. Editable."
    },
    vidaUtil: { nombre: "Vida útil del equipo", valor: 20, unidad: "años", tipo: "supuesto", fuente: "Habitual para pivot central con mantenimiento" },
    tasa: { nombre: "Tasa de descuento", valor: 8, unidad: "% anual en USD", tipo: "supuesto", fuente: "Editable según el costo del capital de cada empresa" },
    referenciaInta: {
      nombre: "Testigo de validación: INTA Manfredi, maíz secano 7.740 kg/ha y riego 14.890 kg/ha; margen bruto 453 y 735 USD/ha",
      valor: { secano: 7.74, riego: 14.89 }, tipo: "fuente", fuente: "INTA Manfredi, abril-mayo 2026",
      url: "https://www.argentina.gob.ar/noticias/cuanto-cuesta-incorporar-riego-tras-la-aprobacion-del-rimi-0"
    }
  }
};
