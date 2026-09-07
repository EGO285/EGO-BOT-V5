// Objets : armes, consommables, équipement, objets de mission/rares.
const ITEMS = {
  kunai:       { nom: "Kunai", cat: "arme", rarete: "commun", valeur: 30, poids: 0.2, effet: { degats: 8 }, desc: "Lame de jet polyvalente." },
  shuriken:    { nom: "Shuriken", cat: "arme", rarete: "commun", valeur: 20, poids: 0.1, effet: { degats: 6 }, desc: "Étoile de jet." },
  parchemin_scellement: { nom: "Parchemin de scellement", cat: "parchemin", rarete: "peu commun", valeur: 120, poids: 0.3, effet: {}, desc: "Permet de sceller des objets ou du chakra." },
  pilule_soldat: { nom: "Pilule de soldat", cat: "potion", rarete: "peu commun", valeur: 150, poids: 0.05, effet: { chakra: 40, endurance: 30 }, desc: "Restaure chakra et endurance." },
  bandage:     { nom: "Bandage", cat: "soin", rarete: "commun", valeur: 40, poids: 0.1, effet: { pv: 25 }, desc: "Soigne les blessures légères." },
  potion_soin: { nom: "Potion de soin", cat: "potion", rarete: "peu commun", valeur: 200, poids: 0.2, effet: { pv: 60 }, desc: "Restaure une bonne partie des PV." },
  ration:      { nom: "Ration de terrain", cat: "nourriture", rarete: "commun", valeur: 25, poids: 0.3, effet: { faim: 40 }, desc: "Coupe la faim en mission." },
  boulette_riz: { nom: "Boulette de riz", cat: "nourriture", rarete: "commun", valeur: 15, poids: 0.2, effet: { faim: 25 }, desc: "En-cas rapide." },
  gourde:      { nom: "Gourde d'eau", cat: "nourriture", rarete: "commun", valeur: 20, poids: 0.4, effet: { soif: 50 }, desc: "Étanche la soif." },
  tente:       { nom: "Tente de camp", cat: "equipement", rarete: "peu commun", valeur: 300, poids: 2, effet: {}, desc: "Permet de dormir en extérieur en sécurité." },
  gilet_jonin: { nom: "Gilet tactique", cat: "armure", rarete: "rare", valeur: 800, poids: 1.5, effet: { resistance: 3 }, desc: "Gilet renforcé des ninjas confirmés." },
  parchemin_katon: { nom: "Parchemin Katon", cat: "objet rare", rarete: "rare", valeur: 900, poids: 0.3, effet: { apprend: "katon_goukakyuu" }, desc: "Enseigne une technique de feu." },
  parchemin_medical: { nom: "Manuel médical", cat: "objet rare", rarete: "rare", valeur: 1000, poids: 0.5, effet: { apprend: "soin_ninja" }, desc: "Enseigne le ninjutsu médical." },
};

// Contenu des boutiques par type.
const SHOPS = {
  armurerie:    { nom: "Armurerie", items: ["kunai", "shuriken", "gilet_jonin"] },
  magasin_ninja:{ nom: "Magasin ninja", items: ["kunai", "shuriken", "parchemin_scellement", "pilule_soldat", "tente"] },
  herboristerie:{ nom: "Herboristerie", items: ["bandage", "potion_soin", "potion_soin"] },
  restaurant:   { nom: "Ichiraku & co", items: ["ration", "boulette_riz", "gourde"] },
  marche_noir:  { nom: "Marché noir", items: ["parchemin_katon", "parchemin_medical", "pilule_soldat"] },
};
module.exports = { ITEMS, SHOPS };
