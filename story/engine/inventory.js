// ============================================================
//  story/engine/inventory.js
//  Inventaire + usage d'objets (effets déterministes).
// ============================================================
const { ITEMS } = require("../data/items");

function find(oc, itemId) { return (oc.inventaire || []).find(i => i.id === itemId); }
function has(oc, itemId, qty = 1) { const s = find(oc, itemId); return s && s.qty >= qty; }

function addItem(oc, itemId, qty = 1) {
    if (!ITEMS[itemId]) return { ok: false, error: "Objet inconnu." };
    if (!Array.isArray(oc.inventaire)) oc.inventaire = [];
    const s = find(oc, itemId);
    if (s) s.qty += qty; else oc.inventaire.push({ id: itemId, qty });
    return { ok: true };
}
function removeItem(oc, itemId, qty = 1) {
    const s = find(oc, itemId);
    if (!s || s.qty < qty) return { ok: false, error: "Objet absent." };
    s.qty -= qty;
    if (s.qty <= 0) oc.inventaire = oc.inventaire.filter(i => i.id !== itemId);
    return { ok: true };
}

// Utilise un objet consommable : applique ses effets aux vitals/besoins, ou apprend un jutsu.
function useItem(oc, itemId) {
    const def = ITEMS[itemId];
    if (!def) return { ok: false, error: "Objet inconnu." };
    if (!has(oc, itemId)) return { ok: false, error: `Tu n'as pas de ${def.nom}.` };
    const e = def.effet || {};
    const effets = [];

    if (e.apprend) {
        if (!oc.techniques.find(t => t.id === e.apprend)) {
            oc.techniques.push({ id: e.apprend, maitrise: 10 });
            effets.push(`apprend une nouvelle technique`);
        } else { return { ok: false, error: "Tu connais déjà cette technique." }; }
    }
    if (e.pv) { oc.vitals.pv = Math.min(oc.stats.pvMax, oc.vitals.pv + e.pv); effets.push(`+${e.pv} PV`); }
    if (e.chakra) { oc.vitals.chakra = Math.min(oc.stats.chakraMax, oc.vitals.chakra + e.chakra); effets.push(`+${e.chakra} chakra`); }
    if (e.endurance) { oc.vitals.endurance = Math.min(oc.stats.enduranceMax, oc.vitals.endurance + e.endurance); effets.push(`+${e.endurance} endurance`); }
    if (e.faim) { oc.besoins.faim = Math.min(100, oc.besoins.faim + e.faim); effets.push(`+${e.faim} faim`); }
    if (e.soif) { oc.besoins.soif = Math.min(100, oc.besoins.soif + e.soif); effets.push(`+${e.soif} soif`); }

    if (def.cat === "potion" || def.cat === "nourriture" || def.cat === "soin" || e.apprend) {
        removeItem(oc, itemId, 1);
    }
    return { ok: true, nom: def.nom, effets };
}

module.exports = { addItem, removeItem, useItem, has, find, ITEMS };
