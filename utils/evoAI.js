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

const HF_TOKEN = process.env.HF_TOKEN || "";
const HF_MODEL = process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct";
const HF_VISION_MODEL = process.env.HF_VISION_MODEL || "meta-llama/Llama-3.2-11B-Vision-Instruct";
const HF_URL = "https://router.huggingface.co/v1/chat/completions";
const TIMEOUT_MS = 30000;

const MAX_TOURS = parseInt(process.env.EVO_MAX_TOURS) || 12;
const DUEL_MAX_TOURS = 20; // l'arbitre garde plus de contexte (mémoire de combat)
const HIST_TTL_S = (parseInt(process.env.EVO_HIST_TTL) || 30) * 24 * 60 * 60;
const HIST_PREFIX = "evo:hist:";
const DUEL_PREFIX = "evo:duel:";

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

// ── Persona de base ─────────────────────────────────────────
const PERSONA = [
    "Tu es E.V.O (EGO VIRTUAL OPERATOR), un assistant virtuel créé par 'ego'.",
    "Tu vis dans un bot WhatsApp de serveur RP/casino/banque nommé Shinobi Storm.",
    "Réponds toujours en français, de façon naturelle, vivante et un peu stylée, mais concise.",
    "Varie tes formulations. Tu te souviens de la conversation : sers-t'en.",
    "Si on te demande qui t'a créé, réponds : ego.",
    "Réponses courtes (2 à 6 phrases) car c'est du chat WhatsApp. Texte simple, quelques emojis si ça colle.",
].join(" ");

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

// ── Appel générique Hugging Face ────────────────────────────
async function callHF(model, messages) {
    const { data } = await axios.post(
        HF_URL,
        { model, messages, max_tokens: 500, temperature: 0.8, top_p: 0.95, stream: false },
        { headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" }, timeout: TIMEOUT_MS }
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

    const systeme = PERSONA + "\n\n" + shinobiContext(msg)
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
            reponse = await callHF(HF_VISION_MODEL, messages);
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
        const detail = e.response?.data?.error || e.message;
        console.error("⚠️ E.V.O IA indisponible, repli local :", detail);
        if (opts.imageDataUrl) {
            return { text: "🖼️ Je vois bien que tu m'as envoyé une image, mais mon module de vision est indisponible pour le moment (quota ou modèle occupé). Réessaie dans un instant.", source: "local" };
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
            reponse = await callHF(HF_VISION_MODEL, messages);
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

module.exports = { askEVO, askArbitre, resetHistory: (id) => delHist(HIST_PREFIX + id), resetDuel: (id) => delHist(DUEL_PREFIX + id) };
