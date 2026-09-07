// ============================================================
//  story/engine/stats.js
//  Système de statistiques : base, dérivées, et effets sur le gameplay.
// ============================================================

// Stats de départ d'un enfant de l'académie.
function baseStats() {
    return {
        pvMax: 100, chakraMax: 100, enduranceMax: 100,
        force: 3, vitesse: 3, reflexes: 3,
        taijutsu: 3, ninjutsu: 3, genjutsu: 2,
        intelligence: 3, perception: 3, volonte: 3,
        controleChakra: 3, resistance: 3, furtivite: 3, precision: 3,
    };
}

// Applique les bonus d'un clan aux stats.
function applyClanBonus(stats, clan) {
    if (!clan || !clan.bonus) return stats;
    for (const [k, v] of Object.entries(clan.bonus)) {
        stats[k] = (stats[k] || 0) + v;
    }
    return stats;
}

// Valeurs vivantes (courantes) initialisées au max.
function freshVitals(stats) {
    return { pv: stats.pvMax, chakra: stats.chakraMax, endurance: stats.enduranceMax };
}

// Besoins de survie (0 = vide/critique, 100 = plein).
function freshNeeds() {
    return { faim: 100, soif: 100, fatigue: 0, moral: 80, stress: 0 };
}

// Malus global (0..1, réduit l'efficacité) selon besoins et blessures.
function conditionPenalty(oc) {
    const n = oc.besoins || {};
    let malus = 0;
    if ((n.faim ?? 100) < 25) malus += 0.15;
    if ((n.soif ?? 100) < 25) malus += 0.15;
    if ((n.fatigue ?? 0) > 75) malus += 0.15;
    if ((oc.vitals?.pv ?? oc.stats.pvMax) < oc.stats.pvMax * 0.3) malus += 0.15;
    if ((n.stress ?? 0) > 75) malus += 0.1;
    return Math.min(0.6, malus);
}

// Efficacité d'une stat après pénalité de condition.
function eff(oc, statName) {
    const val = oc.stats[statName] || 0;
    return val * (1 - conditionPenalty(oc));
}

module.exports = { baseStats, applyClanBonus, freshVitals, freshNeeds, conditionPenalty, eff };
