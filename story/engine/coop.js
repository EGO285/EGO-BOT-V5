// ============================================================
//  story/engine/coop.js
//  Équipes coop : plusieurs joueurs (leur propre OC) forment une escouade
//  et affrontent un boss PARTAGÉ. Persistant dans Upstash.
//    story:coop:<code>   -> { code, chef, membres[], lieu, combat }
//    story:party:<pseudo> -> code
// ============================================================
const db = require("./db");

const K = (c) => `story:coop:${String(c).toUpperCase()}`;
const PK = (p) => `story:party:${p.toLowerCase()}`;
const MAX = 4;
function genCode() { return Math.random().toString(36).slice(2, 6).toUpperCase(); }

async function codeOf(pseudo) { return db.get(PK(pseudo)); }
async function party(pseudo) { const c = await codeOf(pseudo); return c ? db.get(K(c)) : null; }
async function byCode(code) { return db.get(K(code)); }
async function saveParty(p) { return db.set(K(p.code), p); }

async function create(pseudo, lieu) {
    if (await codeOf(pseudo)) return { ok: false, error: "Tu es déjà dans une équipe. Quitte-la d'abord (*!histoire coop quitter*)." };
    let code; do { code = genCode(); } while (await db.get(K(code)));
    const p = { code, chef: pseudo, membres: [pseudo], lieu, createdAt: Date.now(), combat: null };
    await saveParty(p); await db.set(PK(pseudo), code);
    return { ok: true, party: p };
}
async function join(pseudo, code) {
    if (await codeOf(pseudo)) return { ok: false, error: "Quitte d'abord ton équipe actuelle." };
    const p = await byCode(code);
    if (!p) return { ok: false, error: "Code d'équipe invalide." };
    if (p.membres.includes(pseudo)) return { ok: false, error: "Tu es déjà dans cette équipe." };
    if (p.membres.length >= MAX) return { ok: false, error: `Équipe pleine (max ${MAX}).` };
    p.membres.push(pseudo); await saveParty(p); await db.set(PK(pseudo), p.code);
    return { ok: true, party: p };
}
async function leave(pseudo) {
    const c = await codeOf(pseudo);
    if (!c) return { ok: false, error: "Tu n'es dans aucune équipe." };
    const p = await byCode(c);
    await db.del(PK(pseudo));
    if (p) {
        p.membres = p.membres.filter(m => m !== pseudo);
        if (!p.membres.length) { await db.del(K(c)); }
        else { if (p.chef === pseudo) p.chef = p.membres[0]; await saveParty(p); }
    }
    return { ok: true, code: c };
}
async function setCombat(p, enemy) { p.combat = { enemy, tour: 1, downed: [] }; await saveParty(p); }
async function clearCombat(p) { p.combat = null; await saveParty(p); }

module.exports = { codeOf, party, byCode, saveParty, create, join, leave, setCombat, clearCombat, MAX };
