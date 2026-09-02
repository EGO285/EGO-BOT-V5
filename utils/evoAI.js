// ============================================================
//  utils/evoAI.js
//  Cerveau "vraie IA" de E.V.O via l'API d'inférence Hugging Face.
//
//  Le modèle tourne chez Hugging Face : le bot envoie le message + un
//  court historique de la conversation, et reçoit une réponse générée.
//  Aucun modèle n'est chargé en local (pas de RAM/GPU nécessaire).
//
//  Config (.env) :
//    HF_TOKEN  -> ton jeton Hugging Face (gratuit : huggingface.co/settings/tokens)
//    HF_MODEL  -> (optionnel) modèle à utiliser. Défaut : un modèle instruct léger.
//
//  Si HF_TOKEN est absent ou si l'API échoue, on retombe automatiquement
//  sur les réponses locales variées (evoVoice.evoChat) : !evo ne casse jamais.
// ============================================================

const axios = require("axios");
const { evoChat } = require("./evoVoice");

const HF_TOKEN = process.env.HF_TOKEN || "";
const HF_MODEL = process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct";
const HF_URL = "https://router.huggingface.co/v1/chat/completions";
const TIMEOUT_MS = 25000;

// Persona de E.V.O envoyée au modèle à chaque requête.
const SYSTEME = [
    "Tu es E.V.O (EGO VIRTUAL OPERATOR), un assistant virtuel créé par 'ego'.",
    "Tu vis dans un bot WhatsApp de serveur RP/casino/banque.",
    "Réponds toujours en français, de façon naturelle, vivante et un peu stylée, mais concise.",
    "Varie tes formulations à chaque réponse. Ne te répète pas.",
    "Tu peux plaisanter, mais tu restes utile et respectueux.",
    "Si on te demande qui t'a créé, réponds : ego.",
    "Garde tes réponses courtes (2 à 5 phrases max) car c'est du chat WhatsApp.",
    "N'utilise pas de Markdown lourd ni de titres ; du texte simple, quelques emojis si ça colle.",
].join(" ");

// Historique de conversation par chat (en mémoire, borné).
// history[chatId] = [{ role, content }, ...]
const history = {};
const MAX_TOURS = 6;         // nombre de messages user+assistant gardés par chat
const MAX_CHATS = 200;       // nombre de chats gardés en mémoire

function pushHistory(chatId, role, content) {
    if (!history[chatId]) history[chatId] = [];
    history[chatId].push({ role, content });
    // garde seulement les derniers messages
    if (history[chatId].length > MAX_TOURS * 2) {
        history[chatId] = history[chatId].slice(-MAX_TOURS * 2);
    }
    // évite que la map grossisse à l'infini
    const chats = Object.keys(history);
    if (chats.length > MAX_CHATS) delete history[chats[0]];
}

// Réinitialise la mémoire d'un chat (commande !evo reset).
function resetHistory(chatId) {
    delete history[chatId];
}

// Interroge Hugging Face. Retourne { text, source } où source = "hf" ou "local".
async function askEVO(chatId, message) {
    const msg = (message || "").trim();

    // Commande de remise à zéro de la conversation
    if (/^(reset|clear|oublie|nouvelle conversation)$/i.test(msg)) {
        resetHistory(chatId);
        return { text: "🧠 J'ai vidé ma mémoire de cette conversation. On repart de zéro, dis-moi tout.", source: "local" };
    }

    if (!msg) {
        return { text: evoChat(""), source: "local" };
    }

    // Pas de token -> mode local (réponses variées scriptées)
    if (!HF_TOKEN) {
        return { text: evoChat(msg), source: "local" };
    }

    const messages = [
        { role: "system", content: SYSTEME },
        ...(history[chatId] || []),
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

        pushHistory(chatId, "user", msg);
        pushHistory(chatId, "assistant", reponse);

        return { text: reponse, source: "hf" };
    } catch (e) {
        const detail = e.response?.data?.error || e.message;
        console.error("⚠️ E.V.O IA (Hugging Face) indisponible, repli local :", detail);
        // Repli : réponse locale variée, le bot ne casse jamais.
        return { text: evoChat(msg), source: "local" };
    }
}

module.exports = { askEVO, resetHistory };
