// Métadonnées des arcs (timeline). Le contenu détaillé s'ajoute par script d'événement.
// canonLock : événements protégés si activé.
const ARCS = [
  { key: "academie", nom: "Arc Académie", rangMin: "academie", annee: 0, desc: "Formation à l'académie, examens de sortie." },
  { key: "genin", nom: "Arc Genin", rangMin: "genin", annee: 0, desc: "Formation des équipes, premières missions." },
  { key: "vagues", nom: "Pays des Vagues", rangMin: "genin", annee: 0, desc: "Première mission dangereuse hors du village." },
  { key: "chunin", nom: "Examen Chūnin", rangMin: "genin", annee: 1, desc: "Les épreuves, la Forêt de la Mort, l'invasion." },
  { key: "shippuden", nom: "Shippūden", rangMin: "chunin", annee: 3, desc: "Retour, Akatsuki, la guerre approche." },
  { key: "guerre", nom: "Grande Guerre Ninja", rangMin: "jonin", annee: 4, desc: "Le conflit qui embrase le monde ninja." },
  { key: "last", nom: "The Last", rangMin: "jonin", annee: 6, desc: "La menace venue de la Lune." },
  { key: "boruto", nom: "Ère Boruto", rangMin: "jonin", annee: 15, desc: "Une nouvelle génération." },
  { key: "tbv", nom: "Two Blue Vortex", rangMin: "kage", annee: 18, desc: "Le tourbillon bleu." },
];
function arcByKey(k){ return ARCS.find(a=>a.key===k) || ARCS[0]; }
module.exports = { ARCS, arcByKey };
