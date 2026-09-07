// Générateur de missions par rang. Objectifs/récompenses calculés par le moteur.
const MISSION_TEMPLATES = [
  { rang: "D", type: "recherche", titre: "Retrouver le chat Tora", lieu: "konoha", ennemi: null, dureeH: 2, recompense: { ryo: 300, xp: 120 }, desc: "La femme du daimyo a encore perdu son chat." },
  { rang: "D", type: "escorte", titre: "Escorter un marchand", lieu: "route_feu", ennemi: "voyou", dureeH: 6, recompense: { ryo: 700, xp: 260 }, desc: "Protéger un marchand jusqu'au prochain relais." },
  { rang: "C", type: "reconnaissance", titre: "Éclairer la Forêt de la Mort", lieu: "foret_mort", ennemi: null, dureeH: 4, recompense: { ryo: 1200, xp: 500 }, desc: "Cartographier une zone dangereuse." },
  { rang: "C", type: "chasse", titre: "Éliminer les bandits de la route", lieu: "route_feu", ennemi: "chef_bandits", dureeH: 8, recompense: { ryo: 1800, xp: 700 }, desc: "Nettoyer la route du Feu d'une bande de pillards." },
  { rang: "B", type: "protection", titre: "Défendre le pont Tenchi", lieu: "pont_tenchi", ennemi: "zabuza", dureeH: 10, recompense: { ryo: 6000, xp: 2800 }, desc: "Un ninja déserteur menace le pont." },
  { rang: "A", type: "assassinat", titre: "Neutraliser un déserteur de rang A", lieu: "pays_vagues", ennemi: "zabuza", dureeH: 12, recompense: { ryo: 12000, xp: 5000 }, desc: "Mission de haut rang, danger extrême." },
];
module.exports = { MISSION_TEMPLATES };
