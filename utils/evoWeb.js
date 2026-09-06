// ============================================================
//  utils/evoWeb.js
//  Accès internet pour E.V.O :
//    - webSearch(query)   : recherche web via l'API Tavily (clé gratuite)
//    - fetchUrlText(url)   : télécharge une page et en extrait le texte
//    - extractUrls(text)   : repère les liens dans un message
//    - needsWeb(text)      : heuristique "cette question a besoin du web ?"
//
//  Config (.env) :
//    TAVILY_API_KEY -> clé gratuite sur https://app.tavily.com (recherche web)
//  Sans clé, webSearch renvoie null (E.V.O répond alors sans recherche).
//  La lecture d'un lien (fetchUrlText) ne nécessite AUCUNE clé.
// ============================================================

const axios = require("axios");

const TAVILY_KEY = process.env.TAVILY_API_KEY || "";
const TAVILY_URL = "https://api.tavily.com/search";

// Repère les URLs http(s) dans un texte.
function extractUrls(text) {
    const re = /https?:\/\/[^\s]+/gi;
    return (text.match(re) || []).map(u => u.replace(/[.,;:)\]]+$/, ""));
}

// Heuristique : le message a-t-il probablement besoin d'infos fraîches ?
function needsWeb(text) {
    const t = (text || "").toLowerCase();
    if (t.length < 4) return false;
    const cues = [
        "actu", "aujourd", "hier", "récent", "recent", "dernier", "dernière", "derniere",
        "prix", "coûte", "coute", "combien", "météo", "meteo", "température", "temperature",
        "qui est", "qui a ", "c'est quoi", "cest quoi", "c est quoi", "quand", "où se", "resultat",
        "résultat", "score", "news", "nouvelle", "sortie", "date de sortie", "cette année",
        "en ce moment", "maintenant", "classement", "champion", "vainqueur", "gagnant",
        "gagné", "gagne le", "cours de", "bourse", "taux", "président", "president",
        "capitale", "population", "coupe du monde", "ballon d'or", "ballon dor", "âge de", "age de",
    ];
    // Une année (19xx / 20xx) trahit souvent une question factuelle/temporelle.
    if (/\b(19|20)\d{2}\b/.test(t)) return true;
    if (t.trim().endsWith("?") && cues.some(c => t.includes(c))) return true;
    return cues.some(c => t.includes(c));
}

// Télécharge une page web et renvoie un extrait de texte lisible.
async function fetchUrlText(url, maxChars = 3500) {
    try {
        const { data } = await axios.get(url, {
            timeout: 15000,
            maxContentLength: 5 * 1024 * 1024,
            headers: { "User-Agent": "Mozilla/5.0 (EVO-BOT)" },
            responseType: "text",
            transformResponse: [(d) => d], // garde le HTML brut
        });
        const html = typeof data === "string" ? data : String(data);
        const texte = html
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, " ")
            .trim();
        return texte.slice(0, maxChars) || null;
    } catch (e) {
        console.error("⚠️ E.V.O : lecture de page échouée :", e.message);
        return null;
    }
}

// Recherche web via Tavily. Renvoie une chaîne de contexte, ou null.
async function webSearch(query, maxResults = 5) {
    if (!TAVILY_KEY) return null;
    try {
        const { data } = await axios.post(
            TAVILY_URL,
            {
                api_key: TAVILY_KEY,
                query,
                search_depth: "basic",
                max_results: maxResults,
                include_answer: true,
            },
            { timeout: 20000, headers: { "Content-Type": "application/json" } }
        );

        const morceaux = [];
        if (data.answer) morceaux.push(`Résumé : ${data.answer}`);
        (data.results || []).forEach((r, i) => {
            morceaux.push(`(${i + 1}) ${r.title}\n${(r.content || "").slice(0, 500)}\nSource : ${r.url}`);
        });
        const contexte = morceaux.join("\n\n").trim();
        return contexte || null;
    } catch (e) {
        console.error("⚠️ E.V.O : recherche web échouée :", e.response?.data?.error || e.message);
        return null;
    }
}

// Construit un bloc de contexte web à partir d'un message (liens + recherche).
// Renvoie { contexte, sources } où contexte est à injecter dans le prompt.
async function buildWebContext(message) {
    const urls = extractUrls(message);
    const blocs = [];
    const sources = [];

    // 1) lecture directe des liens présents
    for (const url of urls.slice(0, 2)) {
        const txt = await fetchUrlText(url);
        if (txt) {
            blocs.push(`Contenu de la page ${url} :\n${txt}`);
            sources.push(url);
        }
    }

    // 2) recherche web si pertinent (et si aucun lien déjà lu, ou question factuelle)
    if (urls.length === 0 && needsWeb(message)) {
        const res = await webSearch(message);
        if (res) {
            blocs.push(`Résultats de recherche web :\n${res}`);
        }
    }

    return { contexte: blocs.join("\n\n---\n\n") || null, sources };
}

module.exports = { extractUrls, needsWeb, fetchUrlText, webSearch, buildWebContext };
