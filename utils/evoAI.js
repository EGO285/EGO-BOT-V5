// ============================================================
//  utils/evoAI.js
//  Cerveau "vraie IA" de E.V.O via l'API d'inférence Hugging Face.
//
//  Capacités :
//   - Chat intelligent (!evo) avec mémoire persistante PAR PERSONNE (Upstash)
//   - Accès internet (recherche web + lecture de liens) via utils/evoWeb
//   - Vision : E.V.O peut décrire/analyser une image qu'on lui envoie
//   - Connaissance implantée de Shinobi Storm (utils/shinobiLore)
//   - Arbitrage RP (!arbitre) avec mémoire de combat persistante
//
//  Config (.env) :
//   HF_TOKEN        -> jeton Hugging Face (gratuit)
//   HF_MODEL        -> modèle texte (défaut meta-llama/Llama-3.1-8B-Instruct)
//   HF_VISION_MODEL -> modèle vision (défaut meta-llama/Llama-3.2-11B-Vision-Instruct)
//   EVO_MAX_TOURS   -> nb d'échanges gardés (défaut 12)
//   EVO_HIST_TTL    -> durée de vie de la mémoire en jours (défaut 30)
//
//  Repli : sans HF_TOKEN ou si l'API échoue, !evo retombe sur des réponses
//  locales variées (evoVoice) ; l'arbitre prévient qu'il est indisponible.
// ============================================================

const axios = require("axios");
const { Redis } = require("@upstash/redis");
const { evoChat } = require("./evoVoice");
const { SUMMARY, KNOWLEDGE, CARD_RULES, ARBITRE_SYSTEM } = require("./shinobiLore");
const { personaSystem, DEFAULT_KEY } = require("./evoPersona");

// ── FOURNISSEUR IA (multi-backend, tous compatibles OpenAI) ──
// Choisis via AI_PROVIDER : hf | openrouter | groq | gemini | custom.
// Chaque fournisseur lit SA propre clé. openrouter/gemini/groq ont un tier GRATUIT
// (texte ET vision) — pratique quand les crédits Hugging Face sont épuisés.
const AI_PROVIDER = (process.env.AI_PROVIDER || "hf").toLowerCase();

const PRESETS = {
    hf: {
        url: "https://router.huggingface.co/v1/chat/completions",
        key: process.env.HF_TOKEN,
        model: "Qwen/Qwen2.5-72B-Instruct",
        vision: "Qwen/Qwen2.5-VL-7B-Instruct",
        visionList: ["Qwen/Qwen2.5-VL-7B-Instruct", "Qwen/Qwen2.5-VL-72B-Instruct", "meta-llama/Llama-3.2-11B-Vision-Instruct", "google/gemma-3-27b-it", "zai-org/GLM-4.5V"],
    },
    openrouter: {
        url: "https://openrouter.ai/api/v1/chat/completions",
        key: process.env.OPENROUTER_KEY || process.env.AI_KEY,
        model: "meta-llama/llama-3.3-70b-instruct:free",
        vision: "meta-llama/llama-3.2-11b-vision-instruct:free",
        visionList: ["meta-llama/llama-3.2-11b-vision-instruct:free", "qwen/qwen2.5-vl-72b-instruct:free", "google/gemini-2.0-flash-exp:free", "google/gemma-3-27b-it:free"],
    },
    groq: {
        url: "https://api.groq.com/openai/v1/chat/completions",
        key: process.env.GROQ_KEY || process.env.AI_KEY,
        model: "llama-3.3-70b-versatile",
        vision: "meta-llama/llama-4-scout-17b-16e-instruct",
        visionList: ["meta-llama/llama-4-scout-17b-16e-instruct", "meta-llama/llama-4-maverick-17b-128e-instruct"],
    },
    gemini: {
        url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        key: process.env.GEMINI_KEY || process.env.AI_KEY,
        model: "gemini-2.0-flash",
        vision: "gemini-2.0-flash",
        visionList: ["gemini-2.0-flash", "gemini-2.5-flash"],
    },
    custom: {
        url: process.env.AI_BASE_URL,
        key: process.env.AI_KEY,
        model: process.env.HF_MODEL,
        vision: process.env.HF_VISION_MODEL,
        visionList: [process.env.HF_VISION_MODEL].filter(Boolean),
    },
};
const P = PRESETS[AI_PROVIDER] || PRESETS.hf;

const HF_URL = process.env.AI_BASE_URL || P.url;
const HF_TOKEN = process.env.AI_KEY || P.key || process.env.HF_TOKEN || "";
const HF_MODEL = process.env.HF_MODEL || process.env.AI_MODEL || P.model;
const HF_VISION_MODEL = process.env.HF_VISION_MODEL || process.env.AI_VISION_MODEL || P.vision;
// Liste de repli vision : le modèle configuré d'abord, puis ceux du fournisseur.
const VISION_CANDIDATES = [...new Set([HF_VISION_MODEL, ...(P.visionList || [])].filter(Boolean))];
const TIMEOUT_MS = 30000;

// Essaie chaque modèle vision jusqu'à ce qu'un réponde. Lance la dernière
// erreur si tous échouent (pour l'afficher au joueur).
async function callVision(messages) {
    let lastErr = null;
    for (const model of VISION_CANDIDATES) {
        try {
            return { rep: await callHF(model, messages), model };
        } catch (e) {
            lastErr = e;
            const d = e.response?.data?.error || e.message || "";
            console.error(`⚠️ Vision KO (${model}) :`, typeof d === "string" ? d : JSON.stringify(d));
            // 401/403 = problème de token/permissions : inutile d'essayer les autres.
            if (e.response?.status === 401 || e.response?.status === 403) break;
        }
    }
    throw lastErr || new Error("Aucun modèle vision disponible");
}

const MAX_TOURS = parseInt(process.env.EVO_MAX_TOURS) || 12;
const DUEL_MAX_TOURS = 20; // l'arbitre garde plus de contexte (mémoire de combat)
const HIST_TTL_S = (parseInt(process.env.EVO_HIST_TTL) || 30) * 24 * 60 * 60;
const HIST_PREFIX = "evo:hist:";
const DUEL_PREFIX = "evo:duel:";
const PERSONA_PREFIX = "evo:persona:";

// ── Client Redis (réutilise TA base Upstash) ────────────────
let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
    } catch (e) {
        console.error("⚠️ E.V.O : Redis indisponible, mémoire en RAM :", e.message);
    }
}
const ramHistory = {};
const ramPersona = {};

// ── Personnalité choisie par personne ───────────────────────
async function getPersona(scopeId) {
    const k = PERSONA_PREFIX + scopeId;
    if (redis) {
        try { const v = await redis.get(k); return v || ramPersona[k] || DEFAULT_KEY; }
        catch (e) { return ramPersona[k] || DEFAULT_KEY; }
    }
    return ramPersona[k] || DEFAULT_KEY;
}
async function setPersona(scopeId, personaKey) {
    const k = PERSONA_PREFIX + scopeId;
    ramPersona[k] = personaKey;
    if (redis) { try { await redis.set(k, personaKey); } catch (e) {} }
}

// Choisit le bloc de connaissance Shinobi à injecter selon le message.
function shinobiContext(message) {
    const t = (message || "").toLowerCase();
    const profond = /(shinobi|storm|winterson|carte|rang|jutsu|chakra|éveil|eveil|permutation|boost|kunai|duel|arbitr|réactiv|reactiv|corps à corps|corps a corps)/.test(t);
    if (profond) {
        return "Voici la base de connaissances OFFICIELLE de Shinobi Storm. Utilise-la comme vérité absolue :\n\n" + KNOWLEDGE + "\n\n" + CARD_RULES;
    }
    return "Contexte : " + SUMMARY;
}

// ── Helpers historique ──────────────────────────────────────
async function loadHist(key) {
    if (redis) {
        try { const h = await redis.get(key); return Array.isArray(h) ? h : []; }
        catch (e) { return ramHistory[key] || []; }
    }
    return ramHistory[key] || [];
}
async function saveHist(key, hist, maxTours) {
    const borne = hist.slice(-maxTours * 2);
    if (redis) {
        try { await redis.set(key, borne, { ex: HIST_TTL_S }); return; }
        catch (e) { /* repli RAM */ }
    }
    ramHistory[key] = borne;
}
async function delHist(key) {
    if (redis) { try { await redis.del(key); } catch (e) {} }
    delete ramHistory[key];
}

// ── Appel générique (compatible OpenAI : HF / OpenRouter / Groq / Gemini) ──
async function callHF(model, messages) {
    const headers = { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" };
    // OpenRouter apprécie ces en-têtes (facultatifs mais recommandés).
    if (AI_PROVIDER === "openrouter") {
        headers["HTTP-Referer"] = "https://evo-bot.local";
        headers["X-Title"] = "E.V.O";
    }
    const { data } = await axios.post(
        HF_URL,
        { model, messages, max_tokens: 500, temperature: 0.8, top_p: 0.95, stream: false },
        { headers, timeout: TIMEOUT_MS }
    );
    const rep = data?.choices?.[0]?.message?.content?.trim();
    if (!rep) throw new Error("Réponse vide du modèle");
    return rep;
}

// ════════════════════════════════════════════════════════════
//  !evo — chat intelligent (texte, web, vision, lore Shinobi)
//  opts = { webContext, imageDataUrl }
// ════════════════════════════════════════════════════════════
async function askEVO(scopeId, message, opts = {}) {
    const msg = (message || "").trim();
    const key = HIST_PREFIX + scopeId;

    if (/^(reset|clear|oublie|nouvelle conversation)$/i.test(msg) && !opts.imageDataUrl) {
        await delHist(key);
        return { text: "🧠 J'ai vidé ma mémoire de notre conversation. On repart de zéro.", source: "local" };
    }
    if (!msg && !opts.imageDataUrl) return { text: evoChat(""), source: "local" };
    if (!HF_TOKEN) return { text: evoChat(msg), source: "local" };

    const personaKey = await getPersona(scopeId);
    const systeme = personaSystem(personaKey)
        + "\n\nTu ES le bot de ce serveur : tu connais tes propres commandes (préfixe !) et tu peux consulter la base de données des joueurs. Quand des infos sur tes commandes ou ta base sont fournies ci-dessous, appuie-toi dessus (ce sont des données réelles, pas des suppositions)."
        + "\n\n" + shinobiContext(msg)
        + (opts.selfContext ? "\n\n" + opts.selfContext : "")
        + (opts.webContext ? "\n\nINFOS INTERNET (fraîches, utilise-les et cite les sources si tu t'en sers) :\n" + opts.webContext : "");

    const historique = await loadHist(key);

    try {
        let reponse;
        if (opts.imageDataUrl) {
            // ── Mode VISION ──
            const messages = [
                { role: "system", content: systeme },
                ...historique,
                {
                    role: "user",
                    content: [
                        { type: "text", text: msg || "Décris précisément cette image." },
                        { type: "image_url", image_url: { url: opts.imageDataUrl } },
                    ],
                },
            ];
            const vr = await callVision(messages);
            reponse = vr.rep;
            historique.push({ role: "user", content: (msg || "[image envoyée]") + " (image analysée)" });
        } else {
            // ── Mode TEXTE ──
            const messages = [
                { role: "system", content: systeme },
                ...historique,
                { role: "user", content: msg },
            ];
            reponse = await callHF(HF_MODEL, messages);
            historique.push({ role: "user", content: msg });
        }

        historique.push({ role: "assistant", content: reponse });
        await saveHist(key, historique, MAX_TOURS);
        return { text: reponse, source: "hf" };
    } catch (e) {
        let detail = e.response?.data?.error || e.message;
        if (detail && typeof detail !== "string") detail = detail.message || JSON.stringify(detail);
        console.error("⚠️ E.V.O IA indisponible, repli local :", detail);
        if (opts.imageDataUrl) {
            const raison = String(detail || "").slice(0, 180);
            return { text: `🖼️ Je n'arrive pas à analyser l'image.\n⚙️ Raison exacte : ${raison}\n\n_(souvent : le modèle vision n'est pas activé chez ton fournisseur HF, ou ton token n'a pas le droit « Inference Providers ». Vérifie HF_VISION_MODEL sur Render.)_`, source: "local" };
        }
        return { text: evoChat(msg), source: "local" };
    }
}

// ════════════════════════════════════════════════════════════
//  !arbitre — arbitrage RP Shinobi Storm avec mémoire de combat
//  opts = { imageDataUrl }  (ex : une carte de personnage)
// ════════════════════════════════════════════════════════════
async function askArbitre(duelId, action, opts = {}) {
    const act = (action || "").trim();
    const key = DUEL_PREFIX + duelId;

    if (/^(reset|fin|stop|nouveau duel|clear)$/i.test(act)) {
        await delHist(key);
        return { text: "⚖️ Duel réinitialisé. La mémoire de combat est effacée. Lancez un nouveau duel quand vous voulez.", source: "local" };
    }
    if (!act && !opts.imageDataUrl) {
        return { text: "⚖️ *ARBITRE SHINOBI STORM*\n\nDécris une action : *!arbitre <ton action RP>*\nJe garde la mémoire du combat (positions, blessures, techniques...).\n\n_!arbitre reset pour repartir à zéro._", source: "local" };
    }
    if (!HF_TOKEN) {
        return { text: "⚖️ L'arbitre IA nécessite une clé Hugging Face (HF_TOKEN) pour fonctionner. Configure-la et je pourrai arbitrer les duels selon les règles officielles de Shinobi Storm.", source: "local" };
    }

    const historique = await loadHist(key);

    try {
        let reponse;
        const consigne = "Arbitre l'action suivante en appliquant les règles de Shinobi Storm et l'état actuel du combat. Donne un VERDICT clair et explique brièvement.";
        if (opts.imageDataUrl) {
            const messages = [
                { role: "system", content: ARBITRE_SYSTEM },
                ...historique,
                { role: "user", content: [
                    { type: "text", text: `${consigne}\n\nAction / carte : ${act || "(voir l'image de la carte)"}` },
                    { type: "image_url", image_url: { url: opts.imageDataUrl } },
                ] },
            ];
            reponse = (await callVision(messages)).rep;
            historique.push({ role: "user", content: (act || "[carte envoyée]") + " (image analysée)" });
        } else {
            const messages = [
                { role: "system", content: ARBITRE_SYSTEM },
                ...historique,
                { role: "user", content: `${consigne}\n\nAction : ${act}` },
            ];
            reponse = await callHF(HF_MODEL, messages);
            historique.push({ role: "user", content: act });
        }
        historique.push({ role: "assistant", content: reponse });
        await saveHist(key, historique, DUEL_MAX_TOURS);
        return { text: "⚖️ *VERDICT — ARBITRE SHINOBI STORM*\n\n" + reponse, source: "hf" };
    } catch (e) {
        const detail = e.response?.data?.error || e.message;
        console.error("⚠️ E.V.O Arbitre indisponible :", detail);
        return { text: "⚖️ L'arbitre est momentanément indisponible (quota ou modèle occupé). Réessaie dans un instant — la mémoire du combat est conservée.", source: "local" };
    }
}

module.exports = {
    askEVO,
    askArbitre,
    getPersona,
    setPersona,
    callHF,                 // exposé pour la narration du mode Histoire
    hasToken: () => !!HF_TOKEN,
    MODEL: HF_MODEL,
    resetHistory: (id) => delHist(HIST_PREFIX + id),
    resetDuel: (id) => delHist(DUEL_PREFIX + id),
};
