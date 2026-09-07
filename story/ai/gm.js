// ============================================================
//  story/ai/gm.js
//  Couche IA "Game Master" : transforme le résultat déterministe du moteur
//  en narration immersive. Si l'IA est indisponible, on renvoie null et
//  l'appelant utilise le texte mécanique (le jeu fonctionne sans IA).
// ============================================================
const { GM_SYSTEM, buildContext } = require("./prompts");
let evoAI = null;
try { evoAI = require("../../utils/evoAI"); } catch (e) {}

// Narration d'un résultat moteur. Retourne une chaîne, ou null si IA KO.
async function narrate(oc, resultatMoteur, extra = {}) {
    if (!evoAI || !evoAI.hasToken || !evoAI.hasToken()) return null;
    try {
        const messages = [
            { role: "system", content: GM_SYSTEM },
            { role: "user", content: buildContext(oc, resultatMoteur, extra) },
        ];
        const txt = await evoAI.callHF(evoAI.MODEL, messages);
        return (txt && txt.trim()) || null;
    } catch (e) {
        console.error("⚠️ Story GM (IA) indisponible :", e.response?.data?.error || e.message);
        return null;
    }
}
module.exports = { narrate };
