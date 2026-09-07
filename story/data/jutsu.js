// Base de données des techniques. Chaque jutsu est déterministe côté moteur.
// stat : la statistique qui scale les dégâts. cout : chakra. cast : temps d'incantation (tours).
const JUTSU = {
  // --- Base (académie) ---
  henge:    { nom: "Henge no Jutsu (Transformation)", rang: "E", type: "support", nature: null, cout: 5, cast: 0, portee: 0, degats: 0, effet: "deguisement", stat: "controleChakra", prereq: [], desc: "Transformation en une autre apparence." },
  bunshin:  { nom: "Bunshin no Jutsu (Clonage)", rang: "E", type: "support", nature: null, cout: 8, cast: 0, portee: 0, degats: 0, effet: "clones_illusoires", stat: "controleChakra", prereq: [], desc: "Crée des clones illusoires pour tromper l'ennemi." },
  kawarimi: { nom: "Kawarimi (Permutation)", rang: "E", type: "defense", nature: null, cout: 6, cast: 0, portee: 0, degats: 0, effet: "esquive_garantie", cooldown: 2, stat: "reflexes", prereq: [], desc: "Remplace son corps par un leurre pour esquiver un coup." },
  // --- Lancer ---
  shuriken: { nom: "Shuriken Jutsu", rang: "E", type: "physique", nature: null, cout: 2, cast: 0, portee: 5, degats: 12, stat: "precision", prereq: [], desc: "Lancer précis de shuriken." },
  // --- Kage bunshin ---
  kagebunshin: { nom: "Kage Bunshin (Multiclonage)", rang: "B", type: "support", nature: null, cout: 30, cast: 1, portee: 0, degats: 0, effet: "clones_reels", stat: "chakraMax", prereq: [], desc: "Clones solides capables d'agir et de frapper." },
  // --- Katon ---
  katon_goukakyuu: { nom: "Katon: Goukakyuu (Boule de feu suprême)", rang: "C", type: "ninjutsu", nature: "katon", cout: 25, cast: 1, portee: 8, degats: 45, stat: "ninjutsu", prereq: ["nature:katon"], desc: "Souffle une gigantesque boule de feu." },
  // --- Suiton ---
  suiton_teppodama: { nom: "Suiton: Teppōdama (Balle d'eau)", rang: "C", type: "ninjutsu", nature: "suiton", cout: 22, cast: 1, portee: 9, degats: 42, stat: "ninjutsu", prereq: ["nature:suiton"], desc: "Projette une puissante balle d'eau compressée." },
  // --- Raiton ---
  chidori: { nom: "Chidori (Mille oiseaux)", rang: "A", type: "ninjutsu", nature: "raiton", cout: 45, cast: 1, portee: 2, degats: 90, effet: "percant", stat: "ninjutsu", prereq: ["nature:raiton", "rang:chunin"], desc: "Concentration de foudre perçante dans la main." },
  // --- Doton ---
  doton_mur: { nom: "Doton: Mur de terre", rang: "C", type: "defense", nature: "doton", cout: 20, cast: 1, portee: 0, degats: 0, effet: "bouclier", stat: "controleChakra", prereq: ["nature:doton"], desc: "Érige un mur de terre protecteur." },
  // --- Fuuton ---
  fuuton_rafale: { nom: "Fūton: Rafale tranchante", rang: "C", type: "ninjutsu", nature: "fuuton", cout: 24, cast: 1, portee: 7, degats: 44, stat: "ninjutsu", prereq: ["nature:fuuton"], desc: "Lame de vent coupante." },
  // --- Rasengan ---
  rasengan: { nom: "Rasengan (Orbe tourbillonnant)", rang: "A", type: "ninjutsu", nature: null, cout: 45, cast: 1, portee: 1, degats: 85, effet: "impact", stat: "controleChakra", prereq: ["rang:chunin"], desc: "Sphère de chakra en rotation dévastatrice." },
  // --- Taijutsu ---
  poing_souple: { nom: "Jūken (Poing Souple)", rang: "C", type: "taijutsu", nature: null, cout: 10, cast: 0, portee: 1, degats: 35, effet: "bloque_chakra", stat: "taijutsu", prereq: ["clan:hyuga"], desc: "Frappe les points de chakra de l'adversaire." },
  lotus: { nom: "Lotus Initial", rang: "B", type: "taijutsu", nature: null, cout: 15, cast: 1, portee: 1, degats: 70, effet: "contrecoup", stat: "taijutsu", prereq: ["rang:genin"], desc: "Combo aérien dévastateur, mais épuisant pour le corps." },
  // --- Genjutsu ---
  genjutsu_paralysie: { nom: "Genjutsu de paralysie", rang: "C", type: "genjutsu", nature: null, cout: 20, cast: 1, portee: 5, degats: 0, effet: "paralysie", stat: "genjutsu", prereq: [], desc: "Fige l'adversaire dans une illusion." },
  // --- Soin ---
  soin_ninja: { nom: "Ninjutsu médical (soin)", rang: "C", type: "soin", nature: null, cout: 25, cast: 1, portee: 1, degats: -50, effet: "heal", stat: "controleChakra", prereq: [], desc: "Referme les blessures avec du chakra médical." },
};

// Techniques de départ selon le contexte académie.
const STARTER_JUTSU = ["henge", "bunshin", "kawarimi", "shuriken"];

module.exports = { JUTSU, STARTER_JUTSU };
