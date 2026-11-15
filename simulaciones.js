/* Manifiesto del catálogo. El skill "simulador-agro" agrega una entrada por cada simulación nueva. */
window.SIMULACIONES = [
  {
    id: "riego-pivot-maiz",
    rubro: "Agricultura",
    titulo: "Riego por pivot en maíz",
    pregunta: "¿Se paga un pivot en mi campo?",
    resumen: "Probá secano contra riego con el clima real de tu localidad, año por año.",
    decide: ["Regar o no, lámina y umbral", "Fecha de siembra y nitrógeno", "Fuente de energía e inversión"],
    creada: "2026-11-15"
  },
  {
    id: "carga-animal-recria",
    rubro: "Ganadería",
    titulo: "Carga animal en recría",
    pregunta: "¿Cuántos terneros aguanta mi campo?",
    resumen: "Ajustá carga, recursos forrajeros y suplementación, y mirá qué pasa en un año seco.",
    decide: ["Cabezas por hectárea", "Pastura, verdeo y campo natural", "Suplementación y peso de venta"],
    creada: "2026-11-15"
  }
];
