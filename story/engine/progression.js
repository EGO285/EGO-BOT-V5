// ============================================================
//  story/engine/progression.js
//  XP, montées de niveau, points de stats, promotions de rang.
//  Déterministe. L'IA n'attribue jamais d'XP elle-même.
// ============================================================
const { xpForLevel, RANKS, rankIndex, rankByKey } = require("../data/ranks");

// Ajoute de l'XP, gère les montées de niveau. Retourne un rapport.
function addXP(oc, montant) {
    montant = Math.max(0, Math.round(montant));
    oc.xp = (oc.xp || 0) + montant;
    const niveauxGagnes = [];
    let besoin = xpForLevel(oc.niveau);
    while (oc.xp >= besoin) {
        oc.xp -= besoin;
        oc.niveau += 1;
        oc.points = (oc.points || 0) + 3;
        // petite hausse auto de PV/chakra à chaque niveau
        oc.stats.pvMax += 5; oc.stats.chakraMax += 5;
        oc.vitals.pv = oc.stats.pvMax; oc.vitals.chakra = oc.stats.chakraMax;
        niveauxGagnes.push(oc.niveau);
        besoin = xpForLevel(oc.niveau);
    }
    return { xpGagne: montant, niveauxGagnes, niveau: oc.niveau };
}

// XP total requis (approx) pour être éligible à un rang (via seuil du rang).
function xpEligibleRank(oc) {
    // XP "carrière" approximée par niveau atteint : on compare au seuil de rang.
    // Ici on utilise oc.xpCarriere maintenu séparément.
    return oc.xpCarriere || 0;
}

// Le joueur est-il éligible au rang suivant ? (seuil XP carrière + gate d'événement)
function canPromote(oc) {
    const idx = rankIndex(oc.identite.rang);
    if (idx < 0 || idx >= RANKS.length - 1) return { ok: false, raison: "Rang maximal atteint." };
    const suivant = RANKS[idx + 1];
    if ((oc.xpCarriere || 0) < suivant.xp) {
        return { ok: false, raison: `Il te faut ${suivant.xp - (oc.xpCarriere || 0)} XP de carrière de plus.` };
    }
    return { ok: true, rang: suivant };
}

// Promeut réellement au rang suivant (appelé après un examen/mission réussie).
function promote(oc) {
    const c = canPromote(oc);
    if (!c.ok) return c;
    oc.identite.rang = c.rang.key;
    oc.stats.pvMax += c.rang.pvBonus;
    oc.stats.chakraMax += c.rang.chakraBonus;
    oc.points = (oc.points || 0) + c.rang.points;
    oc.vitals.pv = oc.stats.pvMax; oc.vitals.chakra = oc.stats.chakraMax;
    return { ok: true, rang: c.rang };
}

// Dépense un point pour augmenter une stat.
const STATS_AMELIORABLES = ["force","vitesse","reflexes","taijutsu","ninjutsu","genjutsu","intelligence","perception","volonte","controleChakra","resistance","furtivite","precision"];
function allocate(oc, stat, n = 1) {
    if (!STATS_AMELIORABLES.includes(stat)) return { ok: false, error: "Statistique inconnue." };
    if ((oc.points || 0) < n) return { ok: false, error: `Tu n'as que ${oc.points || 0} point(s).` };
    oc.stats[stat] = (oc.stats[stat] || 0) + n;
    oc.points -= n;
    return { ok: true, stat, valeur: oc.stats[stat], reste: oc.points };
}

module.exports = { addXP, canPromote, promote, allocate, STATS_AMELIORABLES };
