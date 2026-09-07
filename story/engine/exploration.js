// ============================================================
//  story/engine/exploration.js
//  Déplacements sur la carte + rencontres aléatoires contrôlées.
// ============================================================
const rng = require("./rng");
const world = require("./world");
const { LOCATIONS, loc } = require("../data/locations");
const { EVENTS } = require("../data/events");
const { eff } = require("./stats");

// Tire un événement pertinent selon le niveau de danger du trajet/zone.
function rollEvent(oc, danger) {
    if (danger <= 0) return { type: "rien", txt: "Aucun incident." };
    // la perception réduit la surprise des mauvaises rencontres (info en plus)
    const pool = EVENTS.filter(e => (e.dangerMin || 0) <= danger);
    const ev = rng.weightedPick(pool);
    return { ...ev };
}

// Voyage vers une destination reliée au lieu courant.
function travel(oc, destId) {
    const ici = loc(oc.lieu);
    if (!ici) return { ok: false, error: "Position inconnue." };
    const lien = (ici.links || []).find(l => l.to === destId);
    if (!lien) {
        const dispo = (ici.links || []).map(l => `${l.to} (${LOCATIONS[l.to]?.nom || l.to})`).join(", ");
        return { ok: false, error: `Impossible d'aller là directement.\nDestinations : ${dispo}` };
    }
    if ((oc.besoins?.fatigue || 0) > 90) return { ok: false, error: "Tu es trop épuisé pour voyager. Repose-toi d'abord (!histoire dormir)." };

    world.advanceTime(oc, lien.heures);
    oc.lieu = destId;
    const ev = rollEvent(oc, lien.danger);
    return { ok: true, dest: LOCATIONS[destId], heures: lien.heures, event: ev };
}

// Explore le lieu courant (peut déclencher un événement selon le danger).
function explorer(oc) {
    const ici = loc(oc.lieu);
    world.advanceTime(oc, 0.5);
    const ev = rollEvent(oc, ici.danger + 1);
    return { ok: true, lieu: ici, event: ev };
}

// Destinations accessibles depuis le lieu courant.
function destinations(oc) {
    const ici = loc(oc.lieu);
    return (ici?.links || []).map(l => ({ id: l.to, nom: LOCATIONS[l.to]?.nom || l.to, heures: l.heures, danger: l.danger }));
}
module.exports = { travel, explorer, destinations, rollEvent };
