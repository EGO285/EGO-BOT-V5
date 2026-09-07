// Rangs shinobi + seuils XP, gains de points/stats et débuts de progression.
const RANKS = [
    { key: "academie", nom: "Académie", xp: 0,     points: 3,  pvBonus: 0,   chakraBonus: 0  },
    { key: "genin",    nom: "Genin",    xp: 300,   points: 5,  pvBonus: 20,  chakraBonus: 20 },
    { key: "chunin",   nom: "Chūnin",   xp: 1200,  points: 6,  pvBonus: 40,  chakraBonus: 40 },
    { key: "jonin-sp", nom: "Jōnin spécial", xp: 3000, points: 7, pvBonus: 60, chakraBonus: 60 },
    { key: "jonin",    nom: "Jōnin",    xp: 6000,  points: 8,  pvBonus: 90,  chakraBonus: 90 },
    { key: "anbu",     nom: "ANBU",     xp: 11000, points: 9,  pvBonus: 130, chakraBonus: 130 },
    { key: "kage",     nom: "Kage / équivalent", xp: 20000, points: 10, pvBonus: 200, chakraBonus: 200 },
    { key: "legende",  nom: "Légende",  xp: 40000, points: 12, pvBonus: 300, chakraBonus: 300 },
];

// XP nécessaire pour passer du niveau n au niveau n+1.
function xpForLevel(niveau) {
    return Math.round(80 * Math.pow(niveau, 1.35));
}

function rankByKey(key) { return RANKS.find(r => r.key === key) || RANKS[0]; }
function rankIndex(key) { return RANKS.findIndex(r => r.key === key); }

module.exports = { RANKS, xpForLevel, rankByKey, rankIndex };
