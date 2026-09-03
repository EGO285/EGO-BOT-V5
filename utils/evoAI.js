// ============================================================
//  utils/evoAI.js
//  Cerveau "vraie IA" de E.V.O via l'API d'inférence Hugging Face.
//
//  Le modèle tourne chez Hugging Face : le bot envoie le message + un
//  historique de la conversation, et reçoit une réponse générée.
//  Aucun modèle n'est chargé en local (pas de RAM/GPU nécessaire).
//
//  🧠 MÉMOIRE PERSISTANTE :
//  L'historique de chaque conversation est stocké dans TON Upstash Redis
//  (clé "evo:hist:<chatId>"). E.V.O se souvient donc de ce qu'on lui a dit
//  même après un redémarrage / redéploiement du bot. Si Upstash n'est pas
//  configuré, on retombe sur une mémoire en RAM (perdue au reboot).
//
//  Config (.env) :
//    HF_TOKEN     -> jeton Hugging Face (gratuit)
//    HF_MODEL     -> (optionnel) modèle à utiliser
//    EVO_MAX_TOURS-> (optionnel) nb d'échanges gardés en mémoire (défaut 12)
//    EVO_HIST_TTL -> (optionnel) durée de vie de l'historique en jours (défaut 30)
//
//  Si HF_TOKEN est absent ou si l'API échoue, on retombe automatiquement
//  sur les réponses locales variées (evoVoice.evoChat) : !evo ne casse jamais.
// ============================================================

const axios = require("axios");
const { Redis } = require("@upstash/redis");
const { evoChat } = require("./evoVoice");

const HF_TOKEN = process.env.HF_TOKEN || "";
const HF_MODEL = process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct";
const HF_URL = "https://router.huggingface.co/v1/chat/completions";
const TIMEOUT_MS = 25000;

const MAX_TOURS = parseInt(process.env.EVO_MAX_TOURS) || 12; // échanges user+assistant gardés
const HIST_TTL_S = (parseInt(process.env.EVO_HIST_TTL) || 30) * 24 * 60 * 60; // en secondes
const HIST_PREFIX = "evo:hist:";

// ── Client Redis (réutilise TA base Upstash) ────────────────
let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
    } catch (e) {
        console.error("⚠️ E.V.O : Redis indisponible pour la mémoire, repli RAM :", e.message);
    }
}

// Repli mémoire vive si pas d'Upstash.
const ramHistory = {};

function histKey(chatId) {
    return HIST_PREFIX + chatId;
}

// Persona de E.V.O envoyée au modèle à chaque requête.
const SYSTEME = [
    "Tu es E.V.O (EGO VIRTUAL OPERATOR), un assistant virtuel créé par 'ego'.",
    "Tu vis dans un bot WhatsApp de serveur RP/casino/banque.",
    "Réponds toujours en français, de façon naturelle, vivante et un peu stylée, mais concise.",
    "Varie tes formulations à chaque réponse. Ne te répète pas.",
    "Tu te souviens de ce que l'utilisateur t'a dit plus tôt dans la conversation : sers-t'en.",
    "Tu peux plaisanter, mais tu restes utile et respectueux.",
    "Si on te demande qui t'a créé, réponds : ego.",
    "Garde tes réponses courtes (2 à 5 phrases max) car c'est du chat WhatsApp.",
    "N'utilise pas de Markdown lourd ni de titres ; du texte simple, quelques emojis si ça colle.",
].join(" ");

// ── Lecture / écriture de l'historique ──────────────────────
async function loadHistory(chatId) {
    if (redis) {
        try {
            const h = await redis.get(histKey(chatId));
            return Array.isArray(h) ? h : [];
        } catch (e) {
            console.error("⚠️ E.V.O : lecture historique échouée :", e.message);
            return ramHistory[chatId] || [];
        }
    }
    return ramHistory[chatId] || [];
}

async function saveHistory(chatId, hist) {
    // borne la taille
    const borne = hist.slice(-MAX_TOURS * 2);
    if (redis) {
        try {
            await redis.set(histKey(chatId), borne, { ex: HIST_TTL_S });
            return;
        } catch (e) {
            console.error("⚠️ E.V.O : écriture historique échouée :", e.message);
        }
    }
    ramHistory[chatId] = borne;
}

async function resetHistory(chatId) {
    if (redis) {
        try { await redis.del(histKey(chatId)); } catch (e) {}
    }
    delete ramHistory[chatId];
}

// ── Interrogation principale ────────────────────────────────
// Retourne { text, source } où source = "hf" ou "local".
async function askEVO(chatId, message) {
    const msg = (message || "").trim();

    // Remise à zéro de la conversation
    if (/^(reset|clear|oublie|nouvelle conversation)$/i.test(msg)) {
        await resetHistory(chatId);
        return { text: "🧠 J'ai vidé ma mémoire de cette conversation. On repart de zéro, dis-moi tout.", source: "local" };
    }

    if (!msg) {
        return { text: evoChat(""), source: "local" };
    }

    // Pas de token -> mode local (réponses variées scriptées)
    if (!HF_TOKEN) {
        return { text: evoChat(msg), source: "local" };
    }

    const historique = await loadHistory(chatId);
    const messages = [
        { role: "system", content: SYSTEME },
        ...historique,
        { role: "user", content: msg },
    ];

    try {
        const { data } = await axios.post(
            HF_URL,
            {
                model: HF_MODEL,
                messages,
                max_tokens: 350,
                temperature: 0.9,
                top_p: 0.95,
                stream: false,
            },
            {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json",
                },
                timeout: TIMEOUT_MS,
            }
        );

        const reponse = data?.choices?.[0]?.message?.content?.trim();
        if (!reponse) throw new Error("Réponse vide du modèle");

        // Sauvegarde le nouvel échange (persistant sur Upstash)
        historique.push({ role: "user", content: msg });
        historique.push({ role: "assistant", content: reponse });
        await saveHistory(chatId, historique);

        return { text: reponse, source: "hf" };
    } catch (e) {
        const detail = e.response?.data?.error || e.message;
        console.error("⚠️ E.V.O IA (Hugging Face) indisponible, repli local :", detail);
        return { text: evoChat(msg), source: "local" };
    }
}

module.exports = { askEVO, resetHistory };
