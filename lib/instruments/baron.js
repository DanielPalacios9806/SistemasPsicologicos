const RESPONSE_SCALE = [
  { value: 1, label: "Rara vez o nunca es mi caso", shortLabel: "Rara vez" },
  { value: 2, label: "Pocas veces es mi caso", shortLabel: "Pocas veces" },
  { value: 3, label: "A veces es mi caso", shortLabel: "A veces" },
  { value: 4, label: "Muchas veces es mi caso", shortLabel: "Muchas veces" },
  { value: 5, label: "Con mucha frecuencia o siempre es mi caso", shortLabel: "Siempre" },
];

const COMPONENTS = {
  intrapersonal: {
    key: "intrapersonal",
    label: "Intrapersonal",
    summary:
      "Explora comprension de si mismo, autoafirmacion, autoconcepto, independencia y direccion personal.",
  },
  interpersonal: {
    key: "interpersonal",
    label: "Interpersonal",
    summary:
      "Explora empatia, responsabilidad social y calidad del vinculo con otras personas.",
  },
  adaptabilidad: {
    key: "adaptabilidad",
    label: "Adaptabilidad",
    summary:
      "Explora solucion de problemas, realismo y flexibilidad frente a cambios o demandas del entorno.",
  },
  manejo_estres: {
    key: "manejo_estres",
    label: "Manejo del estres",
    summary:
      "Explora tolerancia a la tension y regulacion de impulsos en situaciones exigentes.",
  },
  estado_animo: {
    key: "estado_animo",
    label: "Estado de animo general",
    summary:
      "Explora optimismo, satisfaccion personal y disposicion afectiva positiva.",
  },
};

const SUBCOMPONENTS = {
  CM: {
    key: "CM",
    label: "Comprension emocional de si mismo",
    component: "intrapersonal",
    description:
      "Habilidad para percibir y comprender los propios sentimientos, diferenciarlos y entender su origen.",
    itemIds: [7, 9, 23, 35, 52, 63, 88, 116],
  },
  AS: {
    key: "AS",
    label: "Asertividad",
    component: "intrapersonal",
    description:
      "Habilidad para expresar sentimientos, creencias y pensamientos sin agredir y defendiendo derechos de forma no destructiva.",
    itemIds: [22, 37, 67, 82, 96, 111, 126],
  },
  AC: {
    key: "AC",
    label: "Autoconcepto",
    component: "intrapersonal",
    description:
      "Habilidad para comprenderse, aceptarse y respetarse, integrando fortalezas y limitaciones.",
    itemIds: [11, 24, 40, 56, 70, 85, 100, 114, 129],
  },
  AR: {
    key: "AR",
    label: "Autorrealizacion",
    component: "intrapersonal",
    description:
      "Habilidad para movilizarse hacia metas valiosas y hacer lo que se puede, se quiere y se disfruta hacer.",
    itemIds: [6, 21, 36, 51, 66, 81, 95, 110, 125],
  },
  IN: {
    key: "IN",
    label: "Independencia",
    component: "intrapersonal",
    description:
      "Habilidad para autodirigirse y sostener decisiones con seguridad emocional y criterio propio.",
    itemIds: [3, 19, 32, 48, 92, 107, 121],
  },
  EM: {
    key: "EM",
    label: "Empatia",
    component: "interpersonal",
    description:
      "Habilidad para percibir, comprender y apreciar los sentimientos de otras personas.",
    itemIds: [18, 44, 55, 61, 72, 98, 119, 124],
  },
  RI: {
    key: "RI",
    label: "Relaciones interpersonales",
    component: "interpersonal",
    description:
      "Habilidad para establecer y mantener relaciones mutuamente satisfactorias con cercania emocional e intimidad.",
    itemIds: [10, 23, 31, 39, 55, 62, 69, 84, 99, 113, 128],
  },
  RS: {
    key: "RS",
    label: "Responsabilidad social",
    component: "interpersonal",
    description:
      "Habilidad para cooperar, contribuir y funcionar como miembro constructivo del grupo social.",
    itemIds: [16, 30, 46, 61, 72, 76, 90, 98, 104, 119],
  },
  SP: {
    key: "SP",
    label: "Solucion de problemas",
    component: "adaptabilidad",
    description:
      "Habilidad para identificar problemas, definirlos y generar soluciones potencialmente eficaces.",
    itemIds: [1, 15, 29, 45, 60, 75, 89, 118],
  },
  PR: {
    key: "PR",
    label: "Prueba de la realidad",
    component: "adaptabilidad",
    description:
      "Habilidad para evaluar la correspondencia entre la experiencia subjetiva y la realidad objetiva.",
    itemIds: [8, 35, 38, 53, 68, 83, 88, 97, 112, 127],
  },
  FL: {
    key: "FL",
    label: "Flexibilidad",
    component: "adaptabilidad",
    description:
      "Habilidad para ajustar emociones, pensamientos y conductas a condiciones cambiantes.",
    itemIds: [14, 28, 43, 59, 74, 87, 103, 131],
  },
  TE: {
    key: "TE",
    label: "Tolerancia al estres",
    component: "manejo_estres",
    description:
      "Habilidad para sostenerse frente a presion, eventos adversos y emociones intensas sin desorganizarse.",
    itemIds: [4, 20, 33, 49, 64, 78, 93, 108, 122],
  },
  CI: {
    key: "CI",
    label: "Control de impulsos",
    component: "manejo_estres",
    description:
      "Habilidad para resistir impulsos o tentaciones y modular la reaccion emocional.",
    itemIds: [13, 27, 42, 58, 73, 86, 102, 117, 130],
  },
  FE: {
    key: "FE",
    label: "Felicidad",
    component: "estado_animo",
    description:
      "Habilidad para sentirse satisfecho con la propia vida, disfrutar y expresar afectos positivos.",
    itemIds: [2, 17, 31, 47, 62, 77, 91, 105, 120],
  },
  OP: {
    key: "OP",
    label: "Optimismo",
    component: "estado_animo",
    description:
      "Habilidad para mirar la vida con una expectativa positiva y sostener esperanza ante la adversidad.",
    itemIds: [11, 20, 26, 54, 80, 106, 108, 132],
  },
  IMP: {
    key: "IMP",
    label: "Impresion positiva",
    component: "validacion",
    description:
      "Escala de validez orientada a detectar respuesta excesivamente favorable o defensiva.",
    itemIds: [5, 34, 50, 65, 79, 94, 109, 123],
  },
  IMN: {
    key: "IMN",
    label: "Impresion negativa",
    component: "validacion",
    description:
      "Escala de validez orientada a detectar autodescripcion extremadamente negativa o extraña.",
    itemIds: [12, 25, 41, 57, 71, 101, 115],
  },
};

const ITEM_BANK = {
  1: { text: "Para superar las dificuotades que se me presentan, actuo paso a paso", reverse: false },
  2: { text: "Me resulta dificil disfrutar de la vida", reverse: false },
  3: { text: "Prefiero un tipo de trabajo en el cual me indiquen casi todo lo que debo de hacer", reverse: false },
  4: { text: "Se como manejar los problemas mas desagradables", reverse: false },
  5: { text: "Me agradan las personas que conozco", reverse: false },
  6: { text: "Trato de valorar y darle sentido a mi vida", reverse: false },
  7: { text: "Me resulta relativamente facil expresar mis sentimientos", reverse: false },
  8: { text: "Trato de ser realista, no me gusta fantasear ni sonar despierto (a)", reverse: false },
  9: { text: "Entro facilmente en contacto con mis emociones", reverse: false },
  10: { text: "Soy incapaz de demostrar afecto", reverse: false },
  11: { text: "Me siento seguro (a) de mi mismo (a) en la mayoria de las situaciones", reverse: false },
  12: { text: "Tengo la sensacion que algo no esta bien en mi cabeza", reverse: false },
  13: { text: "Tengo problemas para controlarme cuando me enojo", reverse: true },
  14: { text: "Me resulta dificil comenzar cosas nuevas", reverse: false },
  15: { text: "Frente a una situacion problematica obtengo la mayor cantidad de informacion posible para comprender mejor lo que esta pasando", reverse: false },
  16: { text: "Me gusta ayudar a la gente", reverse: false },
  17: { text: "Me es dificil sonreir", reverse: true },
  18: { text: "Soy incapaz de comprender como se sienten los demas", reverse: false },
  19: { text: "Cuando trabajo con otras personas, tiendo a confiar mas en las ideas de los demas que en las mias propias.", reverse: false },
  20: { text: "Creo que tengo la capacidad para poder controlar las situaciones deficiles", reverse: false },
  21: { text: "No puedo identificar mis cualidades, no se realmente para que cosas soy bueno (a).", reverse: true },
  22: { text: "No soy capaz de expresar mis sentimientos", reverse: false },
  23: { text: "Me es dificil compartir mis sentimientos mas intimos", reverse: true },
  24: { text: "No tengo confianza en mismo (a)", reverse: false },
  25: { text: "Creo que he perdido la cabeza", reverse: false },
  26: { text: "Casi todo lo que hago, lo hago con optimismo", reverse: false },
  27: { text: "Cuando comienzo a hablar me rsulta dificil detenerme.", reverse: true },
  28: { text: "En general, me resulta dificil adaptarme a los cambios", reverse: false },
  29: { text: "Antes de intentar solucionar un problema me gusta obtener un panorama general del mismo", reverse: true },
  30: { text: "No me molesta aprovecharme de los demas, especialmente si se lo merecen", reverse: false },
  31: { text: "Soy una persona bastante alegre y optimista.", reverse: false },
  32: { text: "Prefiero que los otros tomen las decisiones por mi", reverse: false },
  33: { text: "Puedo manejar situaciones de estres sin ponerme demasiado nervioso (a)", reverse: false },
  34: { text: "Tengo pensamientos positivos para con los demas", reverse: false },
  35: { text: "Me es dificil entender como me siento", reverse: true },
  36: { text: "He logrado muy poco en los ultimos anos", reverse: false },
  37: { text: "Cuando estoy enojado (a) con alguien se lo puedo decir", reverse: false },
  38: { text: "He tenido experiencias extranas que son inexplicables", reverse: false },
  39: { text: "me resulta facil hacer amigos (as)", reverse: false },
  40: { text: "Me tengo mucho respeto", reverse: false },
  41: { text: "Hago cosas muy raras", reverse: false },
  42: { text: "Soy impulsivo (a) y esto me trae problemas", reverse: false },
  43: { text: "Me resulta dificil cambiar de opinion", reverse: true },
  44: { text: "Tengo la capacidad para comprender los sentimientos ajenos", reverse: false },
  45: { text: "Lo primero que hago cuando tengo un problema es detenerme a pensar", reverse: false },
  46: { text: "A la gente le resulta dificil confiar en mi", reverse: false },
  47: { text: "Estoy contento (a) con mi vida", reverse: false },
  48: { text: "Me resulta dificil tomar decisiones por mi mismo (a)", reverse: false },
  49: { text: "No resisto al estres", reverse: true },
  50: { text: "En mi vida no hago nada malo", reverse: false },
  51: { text: "No disfruto lo que hago", reverse: true },
  52: { text: "Me resulta dificil expresar mis sentimientos mas intimos", reverse: false },
  53: { text: "La gente no comprende mi manera de pensar", reverse: true },
  54: { text: "En general espero que suceda lo mejor", reverse: false },
  55: { text: "Mis amistades me confian sus intimidades", reverse: false },
  56: { text: "No me siento bien conmigo mismo", reverse: false },
  57: { text: "Percibo cosas extranas que los demas o ven", reverse: false },
  58: { text: "La gente me dice que baje el too de voz cuando discuto", reverse: false },
  59: { text: "Me resulta facil adaptarme a situaciones nuevas.", reverse: true },
  60: { text: "Frente a una situacion problematica, analizo todas las opciones y luego opto por la que considero mejor", reverse: false },
  61: { text: "Si veo a un nino llorando me detengo a ayudarlo, aunque en ese momento tenga otro compromiso", reverse: false },
  62: { text: "Soy una persona divertida", reverse: false },
  63: { text: "Soy consciente de como me siento", reverse: false },
  64: { text: "Siento que me resulta dificil controlar mi ansiedad", reverse: false },
  65: { text: "Nada me perturba", reverse: false },
  66: { text: "No me entusiasman mucho mis intereses", reverse: false },
  67: { text: "Cuando no estoy de acuerdo con alguien siento que se lo puedo decir", reverse: false },
  68: { text: "Tengo una tendencia a perder contacto con la realidad y a fantasear.", reverse: false },
  69: { text: "Me es dificil relacionarme con los demas", reverse: true },
  70: { text: "Me resulta dificil aceptarme tal como soy", reverse: false },
  71: { text: "Me siento como si estuviera separado (a) de  mi cuerpo", reverse: false },
  72: { text: "Me importa lo que puede sucederle a los demas", reverse: false },
  73: { text: "Soy impaciente", reverse: true },
  74: { text: "Puedo cambiar mis viejas costumbres", reverse: false },
  75: { text: "Me resulta dificil escoger la mejor solucion cuando tengo que resolver un problema", reverse: true },
  76: { text: "Si pudiera violar la ley sin pagar las consecuencias, lo haria en determinadas situaciones", reverse: false },
  77: { text: "Me deprimo", reverse: true },
  78: { text: "Se como mantener la calma en situaciones dificiles", reverse: false },
  79: { text: "Nunca he mentido", reverse: false },
  80: { text: "En general, me siento motivado (a) para seguir adelante, incluso cuando las cosas se ponen dificiles", reverse: false },
  81: { text: "Trato de seguir adelante con las cosas que me gustan", reverse: false },
  82: { text: "Me resulta dificil decir \"no\" aunque tenga el deseo de hacerlo", reverse: false },
  83: { text: "Me dejo llevar por mi imaginacion y mis fantasias", reverse: true },
  84: { text: "Mis relaciones mas cercanas significan mucho, tanto para mi como para mis amigos", reverse: false },
  85: { text: "Me siento feliz conmigo mismo (a)", reverse: false },
  86: { text: "Tengo reacciones fuertes, intensas que son dificiles de controlar", reverse: false },
  87: { text: "En general, me resulta dificil realizar cambios en mi vida cotidiana", reverse: true },
  88: { text: "Soy consciente de lo que me esta pasando, aun cuando estoy alterado (a)", reverse: false },
  89: { text: "Para poder resolver una situacion que se presenta, analizo todas las posibilidades existentes", reverse: false },
  90: { text: "Soy respetuoso (a) con los demas", reverse: false },
  91: { text: "No estoy muy contento (a con mi vida", reverse: true },
  92: { text: "Prefiero seguir a otros, a ser lider", reverse: false },
  93: { text: "Me resulta dificil enfrentar las cosas desagaradables de la vida", reverse: true },
  94: { text: "Nunca he violado la ley", reverse: false },
  95: { text: "Disfruto de las cosas que me interesan", reverse: false },
  96: { text: "Me resulta relativamente facil decirle a la gente lo que pienso", reverse: false },
  97: { text: "Tengo tendencia a exagerar", reverse: true },
  98: { text: "Soy sensible a los sentimientos de las otras personas", reverse: false },
  99: { text: "Mantengo buenas relaciones con la gente", reverse: false },
  100: { text: "Estoy contento (a) con mi cuerpo", reverse: false },
  101: { text: "Soy una persona muy extrana", reverse: false },
  102: { text: "Soy impulsivo (Ia)", reverse: false },
  103: { text: "Me resulta dificil cambiar mis costumbres", reverse: true },
  104: { text: "Considero que es importante ser un (a) ciudadano (a) que respeta la ley.", reverse: false },
  105: { text: "Disfruto las vacaciones y los fines de semana.", reverse: false },
  106: { text: "En general , tengo una actitud positiva para todo, aun cuando surjan inconvenientes", reverse: false },
  107: { text: "Tengo tendencia a apegarme demasiado a la gente", reverse: true },
  108: { text: "Creo en mi capacidad para manejar los problemas mas dificiles.", reverse: false },
  109: { text: "No me siento avergonzado (a) por nada de lo que he hecho hasta ahora", reverse: false },
  110: { text: "Trato de aprovechar al maximo las cosas que me gustan", reverse: false },
  111: { text: "Los demas piensan que no me hago valer, que me falta firmeza", reverse: false },
  112: { text: "Soy capaz de dejar de fantasear para inmediatamente ponerme a tono con la realidad", reverse: false },
  113: { text: "Los demas opinan que soy una persona sociable", reverse: false },
  114: { text: "Estoy contento (a) con la forma en que me veo", reverse: false },
  115: { text: "Tengo pensamientos extranos que los demas no logran entender", reverse: true },
  116: { text: "Me es dificil describir lo que siento", reverse: false },
  117: { text: "Tengo mal caracter", reverse: true },
  118: { text: "Por lo general, me trabo cuando analizo diferentes opciones para resolver un problema", reverse: false },
  119: { text: "Me es dificil ver sufrir a la gente", reverse: false },
  120: { text: "Me gusta divertirme", reverse: false },
  121: { text: "Me parece que necesito de los demas, mas de lo que ellos me necesitan", reverse: true },
  122: { text: "Me pongo ansioso", reverse: false },
  123: { text: "Nunca tengo un mal dia", reverse: false },
  124: { text: "Intento no herir los sentimientos de los demas", reverse: false },
  125: { text: "No tengo idea de lo que quiero hacer en mi vida", reverse: true },
  126: { text: "Me es dificil hacer valer mis derechos", reverse: false },
  127: { text: "Me es dificil ser realista", reverse: true },
  128: { text: "No mantengo relacion con mis amistades", reverse: false },
  129: { text: "Mis cualidades superan a mis defectos y estos me permiten estar contento (a) conmigo mismo (a)", reverse: false },
  130: { text: "Tengo una tendencia a explotar de rabia facilmente", reverse: false },
  131: { text: "Si me viera obligado (a) a dejar mi casa actual,  me seria dificil adaptarme nuevamente.", reverse: true },
  132: { text: "En general, cuando comienzo algo nuevo tengo la sensacion que voy a fracasar.", reverse: false },
  133: { text: "He respondido sincera y honestamente a las frases anteriores.", reverse: false },
};

const UNASSIGNED_ITEM_IDS = [5, 12, 25, 34, 41, 50, 57, 65, 79, 94, 101, 109, 115, 123, 133];

const MODULE_INTROS = {
  intrapersonal:
    "Este nivel aborda como te percibes, como te expresas y cuanta direccion personal sostienes en tus decisiones.",
  interpersonal:
    "Aqui observamos el vinculo con otras personas: empatia, cercania emocional y responsabilidad social.",
  adaptabilidad:
    "Este nivel explora como analizas problemas, que tan flexible eres y como contrastas tus ideas con la realidad.",
  manejo_estres:
    "Aqui vemos como respondes ante la presion, la ansiedad y los impulsos en momentos exigentes.",
  estado_animo:
    "Este nivel recoge disposicion positiva, disfrute, esperanza y tono afectivo general.",
};

function getMembershipMap() {
  const map = new Map();
  for (const subcomponent of Object.values(SUBCOMPONENTS)) {
    for (const itemId of subcomponent.itemIds) {
      if (!map.has(itemId)) map.set(itemId, []);
      map.get(itemId).push({
        subcomponentKey: subcomponent.key,
        subcomponentLabel: subcomponent.label,
        componentKey: subcomponent.component,
      });
    }
  }
  return map;
}

function resolvePrimaryComponent(itemId, membershipMap) {
  if (membershipMap.has(itemId)) {
    const scoredMembership = membershipMap.get(itemId).find((membership) => membership.componentKey !== "validacion");
    if (scoredMembership) return scoredMembership.componentKey;
  }

  const findNearestScoredComponent = (candidateId) =>
    (membershipMap.get(candidateId) || []).find((membership) => membership.componentKey !== "validacion")?.componentKey;

  for (let next = itemId + 1; next <= 133; next += 1) {
    const componentKey = findNearestScoredComponent(next);
    if (componentKey) return componentKey;
  }

  for (let prev = itemId - 1; prev >= 1; prev -= 1) {
    const componentKey = findNearestScoredComponent(prev);
    if (componentKey) return componentKey;
  }

  return "intrapersonal";
}

const MEMBERSHIP_MAP = getMembershipMap();

const ITEMS = Object.entries(ITEM_BANK).map(([id, definition]) => {
  const itemId = Number(id);
  const memberships = MEMBERSHIP_MAP.get(itemId) || [];
  const moduleKey = resolvePrimaryComponent(itemId, MEMBERSHIP_MAP);

  return {
    id: itemId,
    text: definition.text,
    reverse: definition.reverse,
    moduleKey,
    memberships,
    isValidityOnly: UNASSIGNED_ITEM_IDS.includes(itemId),
  };
});

const MODULES = Object.values(COMPONENTS).map((component, index) => ({
  key: component.key,
  label: component.label,
  summary: component.summary,
  intro: MODULE_INTROS[component.key],
  order: index + 1,
  itemIds: ITEMS.filter((item) => item.moduleKey === component.key).map((item) => item.id),
  subcomponents: Object.values(SUBCOMPONENTS)
    .filter((subcomponent) => subcomponent.component === component.key)
    .map((subcomponent) => ({
      key: subcomponent.key,
      label: subcomponent.label,
      description: subcomponent.description,
      itemIds: subcomponent.itemIds,
    })),
}));

function getInstrumentDefinition() {
  return {
    code: "baron",
    name: "BarOn ICE",
    version: "ICE-JA adultos y jovenes adultos",
    description:
      "Inventario de cociente emocional organizado por componentes y subcomponentes, aplicado en modulos para evitar fatiga y permitir continuidad.",
    responseScale: RESPONSE_SCALE,
    modules: MODULES,
    items: ITEMS,
    components: Object.values(COMPONENTS),
    validationNotes: [
      "Si el item 133 recibe 1, 2 o 3, el protocolo debe revisarse por sinceridad reportada.",
      "Si existen 8 o mas omisiones en los 132 primeros items, el protocolo debe marcarse para revision.",
      "Puntajes muy altos en impresion positiva o negativa requieren cautela interpretativa.",
      "El indice de inconsistencia del material original sigue documentado como pendiente de cierre metodologico en esta version.",
    ],
  };
}

module.exports = {
  RESPONSE_SCALE,
  COMPONENTS,
  SUBCOMPONENTS,
  ITEMS,
  MODULES,
  UNASSIGNED_ITEM_IDS,
  getInstrumentDefinition,
};
