const DISC_GROUPS = [
  ["entusiasta", "rapido/a", "logico/a", "apacible"],
  ["cauteloso/a", "decidido/a", "receptivo/a", "bondadoso/a"],
  ["amigable", "preciso/a", "franco/a", "tranquilo/a"],
  ["elocuente", "controlado/a", "tolerante", "decisivo/a"],
  ["atrevido/a", "concienzudo/a", "comunicativo/a", "moderado/a"],
  ["ameno/a", "ingenioso/a", "investigador/a", "acepta riesgos"],
  ["expresivo/a", "cuidadoso/a", "dominante", "sensible"],
  ["extrovertido/a", "precavido/a", "constante", "impaciente"],
  ["discreto/a", "complaciente", "encantador/a", "insistente"],
  ["valeroso/a", "anima a los demas", "pacifico", "perfeccionista"],
  ["reservado/a", "atento/a", "osado/a", "alegre"],
  ["estimulante", "gentil", "perceptivo/a", "independiente"],
  ["competitivo/a", "considerado/a", "alegre", "sagaz"],
  ["meticuloso/a", "obediente", "ideas firmes", "alentador/a"],
  ["popular", "reflexivo/a", "tenaz", "calmado/a"],
  ["analitico/a", "audaz", "leal", "promotor/a"],
  ["sociable", "paciente", "auto suficiente", "certero/a"],
  ["adaptable", "resuelto/a", "prevenido/a", "vivaz"],
  ["agresivo/a", "impetuoso/a", "amistoso/a", "discerniente"],
  ["de trato facil", "compasivo/a", "cauto/a", "habla directo"],
  ["evaluador/a", "generoso/a", "animado/a", "persistente"],
  ["impulsivo/a", "cuida los detalles", "energico/a", "tranquilo/a"],
  ["sociable", "sistematico/a", "vigoroso/a", "tolerante"],
  ["cautivador/a", "contento/a", "exigente", "apegado/a a las normas"],
  ["le agrada discutir", "metodico/a", "comedido/a", "desenvuelto/a"],
  ["jovial", "preciso/a", "directo/a", "ecuanime"],
  ["inquieto/a", "amable", "elocuente", "cuidadoso/a"],
  ["prudente", "pionero", "espontaneo/a", "colaborador"],
];

const DIMENSION_BY_CHOICE = [
  ["I", "D", "C", "S"],
  ["C", "D", "I", "S"],
  ["I", "C", "D", "S"],
  ["I", "C", "S", "D"],
  ["D", "C", "I", "S"],
  ["I", "S", "C", "D"],
  ["I", "C", "D", "S"],
  ["I", "C", "S", "D"],
  ["C", "S", "I", "D"],
  ["D", "I", "S", "C"],
  ["C", "S", "D", "I"],
  ["I", "S", "C", "D"],
  ["D", "S", "I", "C"],
  ["C", "S", "D", "I"],
  ["I", "C", "D", "S"],
  ["C", "D", "S", "I"],
  ["I", "S", "D", "C"],
  ["S", "D", "C", "I"],
  ["D", "I", "S", "C"],
  ["I", "S", "C", "D"],
  ["C", "S", "I", "D"],
  ["I", "C", "D", "S"],
  ["I", "C", "D", "S"],
  ["I", "S", "D", "C"],
  ["D", "C", "S", "I"],
  ["I", "C", "D", "S"],
  ["D", "S", "I", "C"],
  ["C", "D", "I", "S"],
];

const DIMENSIONS = {
  D: { key: "D", label: "Dominancia" },
  I: { key: "I", label: "Influencia" },
  S: { key: "S", label: "Estabilidad" },
  C: { key: "C", label: "Conciencia" },
};

const ITEMS = DISC_GROUPS.map((words, index) => ({
  id: index + 1,
  text: `Grupo ${index + 1}`,
  moduleKey: "disc",
  choices: words.map((label, choiceIndex) => ({
    key: String.fromCharCode(65 + choiceIndex),
    label,
    dimension: DIMENSION_BY_CHOICE[index][choiceIndex],
  })),
}));

function getInstrumentDefinition() {
  return {
    code: "disc",
    name: "DISC",
    version: "DISC v1 manual suministrado",
    description: "Sistema de Perfil Personal DISC con 28 grupos de eleccion forzada MAS/MENOS.",
    responseType: "disc_forced_choice",
    responseScale: [],
    modules: [
      {
        key: "disc",
        label: "Hoja DISC",
        summary: "Selecciona una palabra en MAS y una palabra en MENOS en cada grupo.",
        intro: "En cada grupo marca la palabra que mas te describe y la que menos te describe. No pueden ser la misma.",
        order: 1,
        itemIds: ITEMS.map((item) => item.id),
      },
    ],
    items: ITEMS,
    dimensions: Object.values(DIMENSIONS),
    manualReferences: [
      "133997765-Manual-Disc.pdf",
      "disc-sistema-de-perfil-personal-instrucciones-y-ejemplos-en-espanol.pdf",
    ],
  };
}

module.exports = {
  DISC_GROUPS,
  DIMENSION_BY_CHOICE,
  DIMENSIONS,
  ITEMS,
  getInstrumentDefinition,
};
