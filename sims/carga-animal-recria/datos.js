/* Parámetros técnicos de la simulación "Carga animal en recría".
   tipo "fuente": dato publicado. tipo "supuesto": valor de trabajo, ajustable.
   Los precios NO van acá: van en comun/precios.js (se actualizan solos).
   Las curvas van de enero a diciembre, en kg MS/ha/día. */
window.DATOS_RECRIA = {
  consultado: "2026-11-15",
  recursos: {
    alfalfa: { nombre: "Pastura base alfalfa", curva: [60, 50, 40, 22, 9, 10, 12, 20, 45, 80, 102, 75], em: 2.5, costo: 130 },
    templada: { nombre: "Pastura templada (festuca y tréboles)", curva: [28, 25, 30, 28, 18, 12, 12, 20, 45, 65, 65, 40], em: 2.4, costo: 110 },
    verdeo: { nombre: "Verdeo de invierno (avena o raigrás)", curva: [0, 0, 0, 20, 28, 18, 16, 22, 30, 20, 0, 0], em: 2.6, costo: 180 },
    natural: { nombre: "Campo natural", curva: [11, 10, 10, 7, 5, 3.5, 3.5, 5.5, 11, 17, 18, 14], em: 2.0, costo: 0 }
  },
  params: {
    curvaAlfalfa: {
      nombre: "Curva de la pastura base alfalfa: pico de 102 kg MS/ha/día en noviembre y mínimo de 9 en mayo (norte de Buenos Aires); el resto de los meses está interpolado",
      valor: {}, tipo: "fuente", fuente: "Documento técnico publicado en argentina.gob.ar (2024)",
      url: "https://argentina.gob.ar/sites/default/files/2024/10/20241009-rta03.pdf"
    },
    curvaVerdeo: {
      nombre: "Curva del verdeo: avena con 28,7 kg MS/ha/día en otoño; 14 a 24 en invierno y salida de invierno",
      valor: {}, tipo: "fuente", fuente: "Chacra Experimental Barrow (avena y raigrás) y guía de manejo por stock de forraje",
      url: "https://www.produccion-animal.com.ar/produccion_y_manejo_pasturas/pasturas_cultivadas_verdeos_invierno/42-avena_raigrass.pdf"
    },
    curvaTemplada: {
      nombre: "Curva de la pastura templada (unos 11.800 kg MS/ha/año, pico de primavera)", valor: {}, tipo: "supuesto",
      fuente: "Forma típica de pasturas de festuca del sudeste bonaerense; sin tabla mensual verificada en esta versión. Ajustar con el nivel productivo."
    },
    curvaNatural: {
      nombre: "Curva del campo natural (unos 3.500 kg MS/ha/año, crecimiento primavero-estival)", valor: {}, tipo: "supuesto",
      fuente: "Los trabajos consultados (UNLP, UCA) dan entre 2.100 y 5.900 kg MS/ha/año para pastizales de la Cuenca del Salado; la distribución mensual es estimada.",
      url: "https://repositorio.uca.edu.ar/bitstream/123456789/363/1/doc.pdf"
    },
    clima: {
      nombre: "Efecto del clima: cada mes la curva se multiplica por (agua disponible ese mes) / (agua disponible normal de ese mes en tu localidad), entre 0,2 y 1,4",
      valor: {}, tipo: "supuesto",
      fuente: "Balance de agua diario con la lluvia y la evapotranspiración de la localidad (suelo de 150 mm de agua útil). Mueve la curva año a año; el nivel general lo fija el usuario."
    },
    aprovechamiento: { nombre: "Aprovechamiento del forraje disponible", valor: 0.6, unidad: "", tipo: "supuesto", fuente: "Pastoreo rotativo: 50 a 70 %" },
    perdida: { nombre: "Pérdida mensual del forraje no comido (envejecimiento)", valor: 0.25, unidad: "", tipo: "supuesto", fuente: "Simplificación" },
    stockInicial: { nombre: "Forraje en pie al entrar la hacienda", valor: 1200, unidad: "kg MS/ha", tipo: "supuesto", fuente: "Dentro del rango de 1.500 a 2.000 kg MS/ha recomendado por INTA Balcarce como stock de manejo, algo por debajo" },
    stockMax: { nombre: "Forraje máximo acumulable", valor: 3000, unidad: "kg MS/ha", tipo: "supuesto", fuente: "Por encima se pierde por pasarse" },
    consumo: {
      nombre: "Consumo voluntario: 2,2 % del peso vivo con forraje de 2,0 Mcal EM/kg, sube 0,1 punto por cada 0,1 Mcal",
      valor: {}, tipo: "supuesto", fuente: "Rangos habituales de consumo en pastoreo (2,2 a 2,8 % del peso vivo)"
    },
    energia: {
      nombre: "Energía: mantenimiento 0,135 Mcal EM por kg de peso metabólico; costo del kilo ganado 6 + 0,02 × peso vivo (Mcal EM)",
      valor: {}, tipo: "supuesto", fuente: "Simplificación de los sistemas de requerimientos (NRC) para novillos en pastoreo"
    },
    emMaiz: { nombre: "Energía del grano de maíz", valor: 3.2, unidad: "Mcal EM/kg MS", tipo: "supuesto", fuente: "Tablas de composición de alimentos" },
    sustitucion: { nombre: "Sustitución: cada kg de grano reemplaza 0,5 kg de pasto cuando el pasto alcanza", valor: 0.5, unidad: "", tipo: "supuesto", fuente: "Rango habitual 0,3 a 0,8" },
    comercializacion: { nombre: "Gastos de compra y de venta (comisión, flete, guías)", valor: 8, unidad: "% de cada operación", tipo: "supuesto", fuente: "Editable" },
    sanidad: { nombre: "Sanidad", valor: 12, unidad: "USD por cabeza y por ciclo", tipo: "supuesto", fuente: "Editable" },
    mortandad: { nombre: "Mortandad", valor: 2, unidad: "%", tipo: "supuesto", fuente: "Editable" },
    costoForraje: {
      nombre: "Costo anual del recurso (USD/ha): pastura base alfalfa 130, pastura templada 110, verdeo 180, campo natural 0",
      valor: {}, tipo: "supuesto", fuente: "Implantación amortizada en 4 años más mantenimiento; verdeo anual. Editable en la simulación."
    }
  }
};
