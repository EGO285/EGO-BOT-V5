// ============================================================
//  story/ui/render.js
//  Rendu immersif des écrans (HUD, fiche, combat).
// ============================================================
const world = require("../engine/world");
const { loc } = require("../data/locations");
const { RANKS, rankByKey } = require("../data/ranks");
const { JUTSU } = require("../data/jutsu");
const { ITEMS } = require("../data/items");
const survival = require("../engine/survival");

function bar(val, max, taille = 10) {
    const n = Math.max(0, Math.min(taille, Math.round((val / max) * taille)));
    return "▰".repeat(n) + "▱".repeat(taille - n);
}

function hud(oc) {
    const l = loc(oc.lieu);
    const nomLieu = oc.lieuNom || (l ? l.nom : oc.lieu);
    const alertes = survival.etat(oc);
    const lignes = [
        "╔══════════════════════╗",
        "   🍥 SHINOBI STORM",
        "      MODE HISTOIRE",
        "╚══════════════════════╝",
        `📍 ${nomLieu}   🕐 ${world.heureTxt(oc)}  ${world.meteoEmoji(oc.timeline.meteo)}`,
        `👤 ${oc.identite.prenom} ${oc.identite.nom}  ·  🥷 ${rankByKey(oc.identite.rang).nom}  ·  Nv.${oc.niveau}`,
        `❤️ PV      ${bar(oc.vitals.pv, oc.stats.pvMax)} ${oc.vitals.pv}/${oc.stats.pvMax}`,
        `🔵 Chakra  ${bar(oc.vitals.chakra, oc.stats.chakraMax)} ${oc.vitals.chakra}/${oc.stats.chakraMax}`,
        `⚡ Endur.  ${bar(oc.vitals.endurance, oc.stats.enduranceMax)} ${oc.vitals.endurance}/${oc.stats.enduranceMax}`,
    ];
    if (alertes.length) lignes.push(`⚠️ ${alertes.join(" · ")}`);
    if (oc.quete) lignes.push(`📜 Mission : ${oc.quete.titre}`);
    return lignes.join("\n");
}

function fiche(oc) {
    const s = oc.stats;
    return [
        "🍥 *FICHE OC — SHINOBI STORM*",
        "▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔",
        `👤 *${oc.identite.prenom} ${oc.identite.nom}* ${oc.identite.surnom ? `« ${oc.identite.surnom} »` : ""}`,
        `🏯 ${oc.identite.village}  ·  🩸 ${oc.identite.clan}  ·  🎂 ${oc.identite.age} ans`,
        `🥷 Rang : *${rankByKey(oc.identite.rang).nom}*  ·  Nv.${oc.niveau}  ·  XP ${oc.xp}`,
        `🎯 Points à répartir : *${oc.points}*  ·  💴 Ryo : ${oc.ryo}`,
        oc.affinites.length ? `🌀 Affinités : ${oc.affinites.join(", ")}` : "🌀 Affinités : aucune",
        oc.kekkeiGenkai.length ? `👁️ Kekkei Genkai : ${oc.kekkeiGenkai.join(", ")}` : "",
        "▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔",
        "📊 *STATS*",
        `force ${s.force} · vitesse ${s.vitesse} · réflexes ${s.reflexes}`,
        `taijutsu ${s.taijutsu} · ninjutsu ${s.ninjutsu} · genjutsu ${s.genjutsu}`,
        `intel ${s.intelligence} · perception ${s.perception} · volonté ${s.volonte}`,
        `contrôle ${s.controleChakra} · résist ${s.resistance} · furtiv ${s.furtivite} · préci ${s.precision}`,
        "▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔",
        `❤️ ${oc.vitals.pv}/${s.pvMax}  🔵 ${oc.vitals.chakra}/${s.chakraMax}  ⚡ ${oc.vitals.endurance}/${s.enduranceMax}`,
    ].filter(Boolean).join("\n");
}

function techniques(oc) {
    const l = oc.techniques.map(t => {
        const j = JUTSU[t.id]; if (!j) return null;
        return `• *${j.nom}* [${j.rang}] — maîtrise ${t.maitrise}% (${j.cout} chakra)`;
    }).filter(Boolean).join("\n");
    return `🌀 *TES TECHNIQUES*\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n${l}\n\n_Utilise-les en combat : !histoire jutsu <nom>_`;
}

function inventaire(oc) {
    if (!oc.inventaire.length) return "🎒 Ton sac est vide.";
    const l = oc.inventaire.map(i => { const d = ITEMS[i.id]; return `• ${d ? d.nom : i.id} ×${i.qty}`; }).join("\n");
    return `🎒 *INVENTAIRE*  ·  💴 ${oc.ryo} Ryo\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n${l}`;
}

module.exports = { hud, fiche, techniques, inventaire, bar };
