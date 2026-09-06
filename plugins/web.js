const { askEVO } = require("../utils/evoAI");
const { webSearch, buildWebContext } = require("../utils/evoWeb");

module.exports = {
    command: "!web",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const query = text.replace("!web", "").trim();
        if (!query) {
            return sock.sendMessage(from, { text: "🌐 *!web <recherche>*\n_Ex : !web dernières nouvelles sur l'IA_\nJe cherche sur internet et je te réponds." });
        }
        try { await sock.sendPresenceUpdate("composing", from); } catch (e) {}

        // Force la recherche web (ou lecture de lien si URL fournie).
        let contexte = null, sources = [];
        const web = await buildWebContext(query);
        contexte = web.contexte;
        sources = web.sources || [];
        if (!contexte) contexte = await webSearch(query);

        if (!contexte) {
            return sock.sendMessage(from, {
                text: "🌐 Je n'ai pas pu chercher sur le web (clé TAVILY_API_KEY manquante, ou aucun résultat). Ajoute la clé dans le .env pour activer la recherche.",
                mentions: [senderJid],
            });
        }

        const scopeId = `${from}|${senderNumber}`;
        const { text: reponse } = await askEVO(scopeId, query, { webContext: contexte });
        const suffixe = sources.length ? `\n\n🔗 ${sources.slice(0, 3).join("\n🔗 ")}` : "";
        await sock.sendMessage(from, { text: "🌐 " + reponse + suffixe, mentions: [senderJid] });
        try { await sock.sendPresenceUpdate("paused", from); } catch (e) {}
    }
};
