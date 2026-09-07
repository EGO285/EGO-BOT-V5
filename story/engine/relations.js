// ============================================================
//  story/engine/relations.js
//  Relations PNJ persistantes + réputations. Les PNJ se souviennent.
// ============================================================
const { NPCS } = require("../data/npcs");

function ensure(oc, npcId) {
    oc.relations = oc.relations || {};
    if (!oc.relations[npcId]) {
        const base = NPCS[npcId]?.relationDepart || 0;
        oc.relations[npcId] = { valeur: base, memoire: [] };
    }
    return oc.relations[npcId];
}
function ajuster(oc, npcId, delta, souvenir) {
    const r = ensure(oc, npcId);
    r.valeur = Math.max(-100, Math.min(100, r.valeur + delta));
    if (souvenir) { r.memoire.unshift({ t: Date.now(), txt: souvenir, delta }); r.memoire = r.memoire.slice(0, 10); }
    return r.valeur;
}
function typeRelation(v) {
    if (v <= -60) return "haine"; if (v <= -20) return "hostile"; if (v < 20) return "neutre";
    if (v < 50) return "amical"; if (v < 80) return "proche"; return "loyal";
}
function reput(oc, champ, delta) {
    oc.reputation = oc.reputation || {};
    oc.reputation[champ] = Math.max(-100, Math.min(100, (oc.reputation[champ] || 0) + delta));
    return oc.reputation[champ];
}
function liste(oc) {
    return Object.entries(oc.relations || {}).map(([id, r]) => ({
        id, nom: NPCS[id]?.nom || id, valeur: r.valeur, type: typeRelation(r.valeur),
    }));
}
module.exports = { ensure, ajuster, typeRelation, reput, liste, NPCS };
