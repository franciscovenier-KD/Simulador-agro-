/* Precios y costos vigentes del Simulador Agro.
   ESTE ARCHIVO LO REESCRIBE LA TAREA PROGRAMADA "simulador-agro-precios" (lun a vie).
   Reglas: cada ítem lleva valor, unidad, fecha del dato (no de la consulta), fuente y url.
   vigenciaDias = a partir de cuántos días el sitio lo marca como desactualizado.
   No borrar claves: las simulaciones las buscan por nombre. */
window.PRECIOS = {
  actualizado: "2026-11-23",
  items: {
    dolar_mayorista: {
      nombre: "Dólar mayorista", valor: 1580, unidad: "ARS/USD", fecha: "2026-11-20",
      fuente: "DolarApi (se actualiza en vivo al abrir la página; este valor es el respaldo)",
      url: "https://dolarapi.com/", vigenciaDias: 5
    },
    maiz_pizarra_rosario: {
      nombre: "Maíz, pizarra Rosario", valor: 272000, unidad: "ARS/t", fecha: "2026-11-19",
      fuente: "Cámara Arbitral de Cereales, Bolsa de Comercio de Rosario",
      url: "https://www.cac.bcr.com.ar/es/precios-de-pizarra", vigenciaDias: 7
    },
    urea: {
      nombre: "Urea granulada (mayorista)", valor: 600, unidad: "USD/t", fecha: "2026-11-07",
      fuente: "Bichos de Campo, demanda argentina de fertilizantes (rango mayorista 595-605 USD/t)",
      url: "https://bichosdecampo.com/?p=302950",
      vigenciaDias: 30
    },
    novillo_inmag: {
      nombre: "Novillo, índice INMAG (Cañuelas)", valor: 3929.88, unidad: "ARS/kg vivo", fecha: "2026-11-13",
      fuente: "Mercado Agroganadero de Cañuelas, vía Agrofy News",
      url: "https://news.agrofy.com.ar/mercado-ganadero", vigenciaDias: 7
    },
    novillito_canuelas: {
      nombre: "Novillito especial hasta 390 kg (Cañuelas)", valor: 4630.91, unidad: "ARS/kg vivo", fecha: "2026-11-13",
      fuente: "Mercado Agroganadero de Cañuelas, promedio del remate, vía Agrofy News",
      url: "https://news.agrofy.com.ar/mercado-ganadero", vigenciaDias: 7
    },
    novillito_pesado_canuelas: {
      nombre: "Novillito especial de más de 390 kg (Cañuelas)", valor: 4262.00, unidad: "ARS/kg vivo", fecha: "2026-11-13",
      fuente: "Mercado Agroganadero de Cañuelas, promedio del remate, vía Agrofy News",
      url: "https://news.agrofy.com.ar/mercado-ganadero", vigenciaDias: 7
    },
    ternero_rosgan: {
      nombre: "Ternero, índice ROSGAN", valor: 6135.40, unidad: "ARS/kg vivo", fecha: "2026-09-09",
      fuente: "ROSGAN (Bolsa de Comercio de Rosario), vía Agrofy News",
      url: "https://news.agrofy.com.ar/mercado-ganadero", vigenciaDias: 35
    },
    riego_inversion_pivot: {
      nombre: "Inversión en pivot (2-3 posiciones)", valor: 2500, unidad: "USD/ha", fecha: "2026-04-25",
      fuente: "INTA Manfredi, relevamiento entre proveedores (Salinas, Giletta, Barberis)",
      url: "https://www.argentina.gob.ar/noticias/cuanto-cuesta-incorporar-riego-tras-la-aprobacion-del-rimi-0",
      vigenciaDias: 270
    },
    riego_mm_red: {
      nombre: "Costo del mm regado, electricidad de red", valor: 1.20, unidad: "USD/mm/ha", fecha: "2026-04-25",
      fuente: "INTA Manfredi", url: "https://www.argentina.gob.ar/noticias/cuanto-cuesta-incorporar-riego-tras-la-aprobacion-del-rimi-0",
      vigenciaDias: 270
    },
    riego_mm_solar: {
      nombre: "Costo del mm regado, energía solar", valor: 0.76, unidad: "USD/mm/ha", fecha: "2026-04-25",
      fuente: "INTA Manfredi (rango 0,68 a 0,84; se usa el punto medio)",
      url: "https://www.argentina.gob.ar/noticias/cuanto-cuesta-incorporar-riego-tras-la-aprobacion-del-rimi-0",
      vigenciaDias: 270
    },
    riego_mm_gasoil: {
      nombre: "Costo del mm regado, gasoil", valor: 2.00, unidad: "USD/mm/ha", fecha: "2026-04-25",
      fuente: "INTA Manfredi (\"2 dólares o más\")",
      url: "https://www.argentina.gob.ar/noticias/cuanto-cuesta-incorporar-riego-tras-la-aprobacion-del-rimi-0",
      vigenciaDias: 270
    }
  }
};
