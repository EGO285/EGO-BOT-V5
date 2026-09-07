// ============================================================
//  story/engine/missions.js
//  Attribution / résolution de missions. Récompenses déterministes.
// ============================================================
const rng = require("./rng");
const { MISSION_TEMPLATES } = require("../data/missions");
const { rankIndex } = require("../data/ranks");
const { addXP } = require("./progression");
const { eff } = require("./stats");
const inv = require("./inventory");

// Missions accessibles selon le rang du joueur (un rang au-dessus max).
function disponibles(oc) {
    const ri = rankIndex(oc.identite.rang);
    const rangsOk = { "academie": ["D"], "genin": ["D", "C"], "chunin": ["C", "B"], "jonin-sp": ["B", "A"], "jonin": ["B", "A", "S"], "anbu": ["A", "S"], "kage": ["A", "S"], "legende": ["S"] };
    const autorises = rangsOk[oc.identite.rang] || ["D"];
    return MISSION_TEMPLATES.filter(m => autorises.includes(m.rang));
}

function accepter(oc, idx) {
    const dispo = disponibles(oc);
    const m = dispo[idx];
    if (!m) return { ok: false, error: "Numéro de mission invalide. Vois !histoire mission." };
    if (oc.quete) return { ok: false, error: `Tu as déjà une mission en cours : « ${oc.quete.titre} ». Termine-la ou abandonne (!histoire abandonner).` };
    oc.quete = { ...m, etape: "en_cours", accepteeLe: oc.timeline.jour };
    return { ok: true, mission: m };
}

// Récompense de fin de mission.
function recompenser(oc, m) {
    const r = m.recompense || {};
    oc.ryo = (oc.ryo || 0) + (r.ryo || 0);
    oc.xpCarriere = (oc.xpCarriere || 0) + (r.xp || 0);
    const lvl = addXP(oc, r.xp || 0);
    oc.reputation.konoha += ({ D: 5, C: 10, B: 20, A: 35, S: 50 })[m.rang] || 5;
    oc.quetesFinies = oc.quetesFinies || []; oc.quetesFinies.push(m.titre);
    oc.quete = null;
    return { ryo: r.ryo || 0, xp: r.xp || 0, lvl };
}

// Résolution d'une mission SANS combat (test de compétences).
function resoudreNonCombat(oc) {
    const m = oc.quete;
    if (!m) return { ok: false, error: "Aucune mission en cours." };
    if (m.ennemi) return { ok: false, error: "Cette mission exige un affrontement : approche l'objectif (!histoire mission combattre)." };
    // test : intelligence + perception vs difficulté du rang
    const seuil = ({ D: 6, C: 12, B: 20, A: 30, S: 40 })[m.rang] || 6;
    const score = eff(oc, "intelligence") + eff(oc, "perception") + rng.int(0, 10);
    const reussi = score >= seuil;
    if (reussi) { const rec = recompenser(oc, m); return { ok: true, reussi: true, rec, mission: m }; }
    // échec : léger malus, mission conservée pour retenter
    oc.reputation.konoha = Math.max(-100, oc.reputation.konoha - 2);
    return { ok: true, reussi: false, mission: m };
}

function abandonner(oc) {
    if (!oc.quete) return { ok: false, error: "Aucune mission à abandonner." };
    const t = oc.quete.titre;
    oc.reputation.konoha = Math.max(-100, oc.reputation.konoha - 5);
    oc.quete = null;
    return { ok: true, titre: t };
}
module.exports = { disponibles, accepter, recompenser, resoudreNonCombat, abandonner };
