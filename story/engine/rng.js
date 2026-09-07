// ============================================================
//  story/engine/rng.js
//  Aléatoire CONTRÔLÉ côté serveur. L'IA ne décide JAMAIS d'un résultat :
//  le moteur tire ici, puis l'IA raconte le résultat déjà calculé.
// ============================================================
function rand() { return Math.random(); }
function int(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
function chance(p) { return rand() < p; }
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
function variance(base, pct = 0.15) { // ±pct autour de base
    const f = 1 + (rand() * 2 - 1) * pct;
    return base * f;
}
function weightedPick(list, poidsKey = "poids") {
    const total = list.reduce((s, x) => s + (x[poidsKey] || 1), 0);
    let r = rand() * total;
    for (const x of list) { r -= (x[poidsKey] || 1); if (r < 0) return x; }
    return list[list.length - 1];
}
module.exports = { rand, int, chance, pick, variance, weightedPick };
