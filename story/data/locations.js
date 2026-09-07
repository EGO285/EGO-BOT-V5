// Carte du monde (graphe de lieux). links = [{to, heures, danger}].
// danger 0..5 : influence la fréquence/force des rencontres.
const LOCATIONS = {
  academie:     { nom: "Académie de Konoha", village: "Konoha", type: "batiment", danger: 0, services: ["academie"], links: [{ to: "konoha", heures: 0.2, danger: 0 }] },
  konoha:       { nom: "Konoha (village)", village: "Konoha", type: "village", danger: 0, services: ["magasin_ninja", "armurerie", "herboristerie", "restaurant", "hopital", "repos"], links: [
      { to: "academie", heures: 0.2, danger: 0 }, { to: "terrain_entrainement", heures: 0.4, danger: 0 },
      { to: "foret_mort", heures: 1, danger: 2 }, { to: "porte_konoha", heures: 0.3, danger: 0 } ] },
  terrain_entrainement: { nom: "Terrains d'entraînement", village: "Konoha", type: "exterieur", danger: 1, services: ["entrainement"], links: [{ to: "konoha", heures: 0.4, danger: 0 }] },
  foret_mort:   { nom: "Forêt de la Mort", village: "Konoha", type: "foret", danger: 4, services: [], links: [{ to: "konoha", heures: 1, danger: 2 }] },
  porte_konoha: { nom: "Grande Porte de Konoha", village: "Konoha", type: "porte", danger: 1, services: [], links: [
      { to: "konoha", heures: 0.3, danger: 0 }, { to: "route_feu", heures: 2, danger: 2 } ] },
  route_feu:    { nom: "Route du Pays du Feu", village: null, type: "route", danger: 3, services: [], links: [
      { to: "porte_konoha", heures: 2, danger: 2 }, { to: "pont_tenchi", heures: 4, danger: 3 }, { to: "pays_vagues", heures: 8, danger: 3 } ] },
  pont_tenchi:  { nom: "Pont du Ciel et de la Terre", village: null, type: "pont", danger: 4, services: [], links: [{ to: "route_feu", heures: 4, danger: 3 }] },
  pays_vagues:  { nom: "Pays des Vagues", village: "Nami", type: "village", danger: 2, services: ["restaurant", "repos", "marche_noir"], links: [{ to: "route_feu", heures: 8, danger: 3 }] },
  suna:         { nom: "Sunagakure (Sable)", village: "Suna", type: "village", danger: 1, services: ["magasin_ninja", "restaurant", "repos"], links: [{ to: "route_feu", heures: 20, danger: 4 }] },
};
const START_LOCATION = "konoha";
function loc(id) { return LOCATIONS[id]; }
module.exports = { LOCATIONS, START_LOCATION, loc };
