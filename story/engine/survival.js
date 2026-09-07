// ============================================================
//  story/engine/survival.js
//  Besoins : faim, soif, fatigue, moral, stress. Évoluent avec le temps.
// ============================================================
function clamp(v, a = 0, b = 100) { return Math.max(a, Math.min(b, v)); }

// Fait évoluer les besoins sur `heures` écoulées.
function tick(oc, heures) {
    const n = oc.besoins || (oc.besoins = { faim: 100, soif: 100, fatigue: 0, moral: 80, stress: 0 });
    n.faim = clamp(n.faim - heures * 4);
    n.soif = clamp(n.soif - heures * 6);
    n.fatigue = clamp(n.fatigue + heures * 5);
    if (n.faim < 20 || n.soif < 20) n.moral = clamp(n.moral - heures * 2);
    return n;
}

// Dormir : restaure fatigue et un peu de PV/chakra ; consomme du temps (géré par world).
function dormir(oc, heures = 8) {
    const n = oc.besoins;
    n.fatigue = clamp(n.fatigue - heures * 12);
    n.moral = clamp(n.moral + heures);
    n.stress = clamp(n.stress - heures * 3);
    oc.vitals.pv = Math.min(oc.stats.pvMax, oc.vitals.pv + heures * 4);
    oc.vitals.chakra = Math.min(oc.stats.chakraMax, oc.vitals.chakra + heures * 6);
    oc.vitals.endurance = oc.stats.enduranceMax;
    return { heures };
}

// Résumé lisible de l'état de survie.
function etat(oc) {
    const n = oc.besoins || {};
    const alertes = [];
    if (n.faim < 25) alertes.push("😖 affamé");
    if (n.soif < 25) alertes.push("🥵 assoiffé");
    if (n.fatigue > 75) alertes.push("😴 épuisé");
    if (n.stress > 75) alertes.push("😰 stressé");
    return alertes;
}
module.exports = { tick, dormir, etat, clamp };
