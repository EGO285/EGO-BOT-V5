// ============================================================
//  story/engine/worldmap.js
//  Carte PERSISTANTE par joueur : superpose les lieux GÉNÉRÉS (open world
//  procédural) au monde statique de base. Sauvegardée dans Upstash pour
//  qu'on retrouve exactement le même monde en revenant jouer.
//
//  Clé Upstash : story:map:<pseudo>
//  Structure : { locations: { id: loc }, edges: { id: [{to, heures, danger}] }, decouverts: [ids] }
// ============================================================
const db = require("./db");
const world = require("./world");
const { LOCATIONS, loc: staticLoc } = require("../data/locations");
const { generateLocation } = require("../ai/worldgen");

const MAP_KEY = (p) => `story:map:${p.toLowerCase()}`;

async function load(pseudo) {
    const m = await db.get(MAP_KEY(pseudo));
    return m || { locations: {}, edges: {}, decouverts: [] };
}
async function save(pseudo, map) { return db.set(MAP_KEY(pseudo), map); }

// Résout un lieu par id : généré d'abord, sinon statique.
function resolve(map, id) { return (map.locations && map.locations[id]) || staticLoc(id) || null; }

// Voisins d'un lieu : liens statiques + arêtes générées.
function neighbors(map, id) {
    const out = [];
    const stat = staticLoc(id);
    if (stat) (stat.links || []).forEach(l => out.push({ to: l.to, heures: l.heures, danger: l.danger }));
    (map.edges?.[id] || []).forEach(e => { if (!out.find(o => o.to === e.to)) out.push(e); });
    return out;
}

function destinations(map, id) {
    return neighbors(map, id).map(n => {
        const l = resolve(map, n.to);
        return { id: n.to, nom: l ? l.nom : n.to, heures: n.heures, danger: n.danger, genere: !!(map.locations && map.locations[n.to]) };
    });
}

// Ajoute un lieu généré, relié bidirectionnellement au lieu d'origine.
function addLocation(map, newLoc, fromId, heures, danger) {
    map.locations[newLoc.id] = newLoc;
    map.edges[fromId] = map.edges[fromId] || [];
    map.edges[newLoc.id] = map.edges[newLoc.id] || [];
    if (!map.edges[fromId].find(e => e.to === newLoc.id)) map.edges[fromId].push({ to: newLoc.id, heures, danger });
    if (!map.edges[newLoc.id].find(e => e.to === fromId)) map.edges[newLoc.id].push({ to: fromId, heures, danger });
    if (!map.decouverts.includes(newLoc.id)) map.decouverts.push(newLoc.id);
}

// Voyage vers un id (statique OU généré). Avance le temps, déplace le joueur.
function travel(oc, map, destId) {
    const from = oc.lieu;
    const edge = neighbors(map, from).find(n => n.to === destId);
    if (!edge) return { ok: false, error: "Destination non reliée. Vois !histoire carte." };
    world.advanceTime(oc, edge.heures);
    oc.lieu = destId;
    const dest = resolve(map, destId);
    return { ok: true, dest, heures: edge.heures, danger: edge.danger };
}

// Détermine la "région" courante pour cohérence de génération.
function region(oc, map) {
    const l = resolve(map, oc.lieu);
    return l?.village ? `abords de ${l.village}` : (l?.type ? `terres sauvages (${l.type})` : "terres sauvages du monde ninja");
}

// AVENTURE : génère un nouveau lieu frontière depuis la position actuelle,
// le persiste, et y déplace le joueur.
async function aventurer(oc, pseudo) {
    const map = await load(pseudo);
    const from = resolve(map, oc.lieu);
    const fromNom = from ? from.nom : oc.lieu;
    const newLoc = await generateLocation(oc, fromNom, region(oc, map));
    const heures = Math.max(0.5, Math.round((1 + newLoc.danger * 0.6 + Math.random()) * 10) / 10);
    addLocation(map, newLoc, oc.lieu, heures, newLoc.danger);
    world.advanceTime(oc, heures);
    oc.lieu = newLoc.id;
    await save(pseudo, map);
    return { ok: true, loc: newLoc, heures, map };
}

module.exports = { load, save, resolve, neighbors, destinations, addLocation, travel, aventurer, region, MAP_KEY };
