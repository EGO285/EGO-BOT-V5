// ============================================================
//  utils/evoGame.js
//  Petits helpers partagés par les nouvelles commandes E.V.O
//  (jeux, métiers RP, économie) : gestion des cooldowns stockés
//  directement sur la fiche joueur, et formatage de durées.
// ============================================================

// Vérifie le cooldown d'une action pour un joueur.
// Les cooldowns sont stockés dans user.cd = { <cle>: timestampMs }.
// Retourne { ready: bool, resteMs: number }.
function getCooldown(user, cle, dureeMs) {
    if (!user.cd || typeof user.cd !== "object") user.cd = {};
    const last = user.cd[cle] || 0;
    const reste = last + dureeMs - Date.now();
    return { ready: reste <= 0, resteMs: Math.max(0, reste) };
}

// Marque l'action comme utilisée maintenant.
function setCooldown(user, cle) {
    if (!user.cd || typeof user.cd !== "object") user.cd = {};
    user.cd[cle] = Date.now();
}

// Formate une durée en ms → "2h15min" / "45min" / "30s".
function formatDuree(ms) {
    const s = Math.ceil(ms / 1000);
    if (s < 60) return `${s}s`;
    const min = Math.floor(s / 60);
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    const r = min % 60;
    return r ? `${h}h${r}min` : `${h}h`;
}

// Entier aléatoire entre min et max inclus.
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Vrai avec une probabilité p (0..1).
function chance(p) {
    return Math.random() < p;
}

module.exports = { getCooldown, setCooldown, formatDuree, rand, chance };
