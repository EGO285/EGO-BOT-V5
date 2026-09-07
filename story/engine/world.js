// ============================================================
//  story/engine/world.js
//  Temps (calendrier), météo, jour/nuit. Le temps avance réellement.
// ============================================================
const rng = require("./rng");
const survival = require("./survival");

const METEOS = ["clair", "nuageux", "pluie", "brouillard", "orage", "neige", "canicule"];
const SAISONS = ["printemps", "été", "automne", "hiver"];

// Avance le temps de `heures`, met à jour date/météo et les besoins.
function advanceTime(oc, heures) {
    const t = oc.timeline;
    t.heure += heures;
    while (t.heure >= 24) { t.heure -= 24; t.jour += 1; }
    // météo : petite chance de changer
    if (rng.chance(0.3)) t.meteo = rng.pick(METEOS);
    // saison tous les 30 jours
    t.saison = SAISONS[Math.floor((t.jour - 1) / 30) % 4];
    if (t.jour > 120) { t.annee += Math.floor((t.jour - 1) / 120); t.jour = ((t.jour - 1) % 120) + 1; }
    survival.tick(oc, heures);
    return t;
}

function isNuit(oc) { const h = oc.timeline.heure; return h < 6 || h >= 20; }
function periode(oc) {
    const h = oc.timeline.heure;
    if (h < 6) return "nuit"; if (h < 12) return "matin"; if (h < 18) return "après-midi"; if (h < 20) return "soir"; return "nuit";
}
function meteoEmoji(m) {
    return ({ clair: "🌤️", nuageux: "☁️", pluie: "🌧️", brouillard: "🌫️", orage: "⛈️", neige: "❄️", canicule: "🔥" })[m] || "🌤️";
}
function heureTxt(oc) {
    const h = Math.floor(oc.timeline.heure);
    const m = Math.round((oc.timeline.heure - h) * 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
module.exports = { advanceTime, isNuit, periode, meteoEmoji, heureTxt, METEOS };
