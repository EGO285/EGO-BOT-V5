const { askEVO } = require("../utils/evoAI");
const { getImageDataUrl, hasImage } = require("../utils/evoMedia");
const { buildWebContext } = require("../utils/evoWeb");

module.exports = {
    command: "!evo",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const message = text.replace("!evo", "").trim();

        // Mémoire PAR PERSONNE (chat + expéditeur).
        const scopeId = `${from}|${senderNumber}`;

        const imagePresente = hasImage(m);

        if (!message && !imagePresente) {
            return sock.sendMessage(from, {
                text: "💬 Parle-moi ! *!evo <ton message>*\n🖼️ Envoie-moi une image (ou réponds à une image) avec *!evo <question>* et je l'analyse.\n🌐 Je peux chercher sur internet et lire des liens.\n_(tape !evo reset pour effacer TA conversation)_",
                mentions: [senderJid],
            });
        }

        try { await sock.sendPresenceUpdate("composing", from); } catch (e) {}

        const opts = {};

        // 1) Image (vision)
        if (imagePresente) {
            const img = await getImageDataUrl(sock, m);
            if (img?.tooLarge) {
                return sock.sendMessage(from, { text: "🖼️ L'image est trop lourde pour que je l'analyse (max ~4 Mo). Renvoie-la en qualité réduite.", mentions: [senderJid] });
            }
            if (img?.dataUrl) opts.imageDataUrl = img.dataUrl;
        }

        // 2) Internet (liens + recherche) — seulement en mode texte
        let sources = [];
        if (!opts.imageDataUrl) {
            try {
                const web = await buildWebContext(message);
                if (web.contexte) opts.webContext = web.contexte;
                sources = web.sources || [];
            } catch (e) {}
        }

        const { text: reponse } = await askEVO(scopeId, message, opts);

        const suffixe = sources.length ? `\n\n🔗 ${sources.slice(0, 2).join("\n🔗 ")}` : "";
        await sock.sendMessage(from, { text: reponse + suffixe, mentions: [senderJid] });
        try { await sock.sendPresenceUpdate("paused", from); } catch (e) {}
    }
};
