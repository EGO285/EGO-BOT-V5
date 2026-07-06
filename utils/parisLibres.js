// ============================================================
//  utils/parisLibres.js
//  Système de paris libres 1v1, stocké sur Upstash Redis
//  (comme les fiches joueurs, pour survivre aux redéploiements Render).
//
//  Structure de stockage :
//    - clé "paris:active:<chatJid>" -> JSON { [id]: session }  (sessions en cours d'un chat)
//    - clé "paris:active:index"     -> Set des chatJid ayant des sessions actives
//    - clé "paris:nextId"           -> compteur Redis (INCR) pour des ID uniques
//    - clé "paris:historique"       -> Liste des sessions clôturées (300 dernières)
// ============================================================

const { Redis } = require("@upstash/redis");

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ACTIVE_PREFIX = "paris:active:";
const ACTIVE_INDEX_KEY = "paris:active:index";
const NEXT_ID_KEY = "paris:nextId";
const HISTORY_KEY = "paris:historique";

function activeKey(chatJid) {
    return `${ACTIVE_PREFIX}${chatJid}`;
}

// Récupère toutes les sessions actives d'un chat donné : { [id]: session }
async function getSessionsForChat(chatJid) {
    const data = await redis.get(activeKey(chatJid));
    return data || {};
}

// Sauvegarde les sessions actives d'un chat (supprime la clé si plus aucune session)
async function saveSessionsForChat(chatJid, sessions) {
    if (!sessions || Object.keys(sessions).length === 0) {
        await redis.del(activeKey(chatJid));
        await redis.srem(ACTIVE_INDEX_KEY, chatJid);
    } else {
        await redis.set(activeKey(chatJid), sessions);
        await redis.sadd(ACTIVE_INDEX_KEY, chatJid);
    }
}

// Génère un nouvel ID de session unique (atomique via INCR, pas de collision possible)
async function nextSessionId() {
    const id = await redis.incr(NEXT_ID_KEY);
    return String(id);
}

// Récupère TOUTES les sessions actives, tous chats confondus (utilisé par !mesparis)
async function getAllActiveSessions() {
    const chats = await redis.smembers(ACTIVE_INDEX_KEY);
    if (!chats || !chats.length) return [];

    const results = [];
    for (const chatJid of chats) {
        const sessions = await getSessionsForChat(chatJid);
        for (const [id, session] of Object.entries(sessions)) {
            results.push({ chatJid, id, ...session });
        }
    }
    return results;
}

// ──────────────────────────────────────────────
// Calcule les cotes décimales des deux joueurs à partir de leurs points de
// classement (!classement / !rang). Plus l'écart de points est grand, plus
// la cote de l'outsider est élevée (comme un vrai bookmaker).
// ──────────────────────────────────────────────
function calculerCotes(pointsA, pointsB) {
    const pA = Math.max(pointsA, 0) + 1;
    const pB = Math.max(pointsB, 0) + 1;

    let probaA = pA / (pA + pB);
    probaA = Math.min(0.95, Math.max(0.05, probaA));
    const probaB = 1 - probaA;

    const MARGE = 0.95;
    const coteA = Math.round((1 / probaA) * MARGE * 100) / 100;
    const coteB = Math.round((1 / probaB) * MARGE * 100) / 100;

    return { coteA, coteB };
}

// Archive une session clôturée dans l'historique global (borné aux 300 dernières)
async function archiverSession(entry) {
    await redis.lpush(HISTORY_KEY, JSON.stringify(entry));
    await redis.ltrim(HISTORY_KEY, 0, 299);
}

// Récupère les n dernières sessions clôturées de l'historique
async function getHistorique(n = 300) {
    const raw = await redis.lrange(HISTORY_KEY, 0, n - 1);
    return (raw || []).map(r => (typeof r === "string" ? JSON.parse(r) : r));
}

module.exports = {
    getSessionsForChat,
    saveSessionsForChat,
    nextSessionId,
    getAllActiveSessions,
    calculerCotes,
    archiverSession,
    getHistorique,
};
