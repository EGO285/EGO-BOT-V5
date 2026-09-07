// Tables d'événements aléatoires par niveau de danger. type pilote le moteur.
const EVENTS = [
  { id: "marchand_itinerant", poids: 3, dangerMin: 1, type: "marchand", txt: "Un marchand itinérant déballe ses marchandises sur le bord du chemin." },
  { id: "embuscade_bandits", poids: 4, dangerMin: 2, type: "combat", ennemi: "voyou", txt: "Des bandits surgissent des fourrés, armes au clair !" },
  { id: "ninja_ennemi", poids: 2, dangerMin: 3, type: "combat", ennemi: "voyou", txt: "Un ninja au bandeau rayé bloque le passage." },
  { id: "tresor", poids: 1, dangerMin: 1, type: "tresor", txt: "Un éclat métallique attire ton regard sous des racines." },
  { id: "pnj_detresse", poids: 2, dangerMin: 1, type: "rencontre", txt: "Un voyageur blessé appelle à l'aide." },
  { id: "anomalie_chakra", poids: 1, dangerMin: 3, type: "mystere", txt: "Une étrange concentration de chakra fait vibrer l'air." },
  { id: "rien", poids: 5, dangerMin: 0, type: "rien", txt: "Le trajet se déroule sans incident notable." },
];
module.exports = { EVENTS };
