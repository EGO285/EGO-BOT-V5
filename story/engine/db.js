// ============================================================
//  story/engine/db.js
//  Persistance du mode Histoire sur Upstash (isolée du reste).
//  Clés :  story:oc:<pseudo>  ·  story:world  ·  story:logs:<pseudo>
//  Repli RAM si Upstash indisponible : le jeu reste jouable en session.
// ============================================================
const { Redis } = require("@upstash/redis");

let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
        redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
    } catch (e) { console.error("⚠️ Story DB: Redis KO, repli RAM:", e.message); }
}
const ram = new Map();

const OC = (p) => `story:oc:${p.toLowerCase()}`;
const LOG = (p) => `story:logs:${p.toLowerCase()}`;
const WORLD = "story:world";

async function get(key) {
    if (redis) { try { const v = await redis.get(key); return v ?? (ram.has(key) ? ram.get(key) : null); } catch (e) { return ram.get(key) ?? null; } }
    return ram.has(key) ? ram.get(key) : null;
}
async function set(key, val) {
    ram.set(key, val);
    if (redis) { try { await redis.set(key, val); } catch (e) {} }
}
async function del(key) {
    ram.delete(key);
    if (redis) { try { await redis.del(key); } catch (e) {} }
}

// --- Profils OC ---
async function getOC(pseudo) { return get(OC(pseudo)); }
async function saveOC(pseudo, oc) { oc.updatedAt = Date.now(); return set(OC(pseudo), oc); }
async function delOC(pseudo) { await del(OC(pseudo)); await del(LOG(pseudo)); }

// --- Logs techniques (anti-cheat / observabilité) ---
async function pushLog(pseudo, type, detail) {
    let logs = (await get(LOG(pseudo))) || [];
    logs.unshift({ t: Date.now(), type, detail });
    logs = logs.slice(0, 100);
    await set(LOG(pseudo), logs);
}
async function getLogs(pseudo) { return (await get(LOG(pseudo))) || []; }

// --- État du monde partagé (présence par lieu, etc.) ---
async function getWorld() { return (await get(WORLD)) || { presence: {} }; }
async function saveWorld(w) { return set(WORLD, w); }

module.exports = { get, set, del, getOC, saveOC, delOC, pushLog, getLogs, getWorld, saveWorld, OC, LOG, WORLD };
