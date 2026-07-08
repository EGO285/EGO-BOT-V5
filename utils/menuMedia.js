// ============================================================
//  utils/menuMedia.js
//  Permet de changer l'image (ou vidéo) affichée par !menu et les autres
//  commandes de type "menu", sans toucher au code — stocké sur Upstash Redis
//  pour survivre aux redéploiements Render.
// ============================================================

const { Redis } = require("@upstash/redis");

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error("❌ [menuMedia] UPSTASH_REDIS_REST_URL et/ou UPSTASH_REDIS_REST_TOKEN manquant(s) dans les variables d'environnement.");
}

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const PREFIX = "menuMedia:";

// Noms de menus reconnus (pour lister les options disponibles à l'admin)
const MENUS_CONNUS = ["menu"];

// Détecte si une URL pointe vers une vidéo (extension connue) ou une image par défaut
function detecterType(url) {
    const ext = (url.split("?")[0].split(".").pop() || "").toLowerCase();
    if (["mp4", "mov", "webm", "mkv", "avi", "3gp"].includes(ext)) return "video";
    return "image";
}

// Récupère le média configuré pour un menu donné. Si rien n'est configuré,
// retourne le média par défaut fourni par l'appelant (celui codé en dur à l'origine).
async function getMenuMedia(nom, urlParDefaut, typeParDefaut = "image") {
    const data = await redis.get(`${PREFIX}${nom}`);
    if (data && data.url) return data;
    return { url: urlParDefaut, type: typeParDefaut };
}

// Définit le média d'un menu (image ou vidéo, détecté automatiquement si non précisé)
async function setMenuMedia(nom, url, type) {
    const media = { url, type: type || detecterType(url), updatedAt: new Date().toISOString() };
    await redis.set(`${PREFIX}${nom}`, media);
    return media;
}

module.exports = { getMenuMedia, setMenuMedia, detecterType, MENUS_CONNUS };
