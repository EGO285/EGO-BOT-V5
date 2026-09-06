const { askArbitre } = require("../utils/evoAI");
const { getImageDataUrl, hasImage } = require("../utils/evoMedia");

module.exports = {
    command: "!arbitre",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const action = text.replace("!arbitre", "").trim();

        // Mémoire de combat PARTAGÉE par chat (le duel se joue dans ce chat).
        const duelId = from;

        try { await sock.sendPresenceUpdate("composing", from); } catch (e) {}

        const opts = {};
        if (hasImage(m)) {
            const img = await getImageDataUrl(sock, m);
            if (img?.tooLarge) {
                return sock.sendMessage(from, { text: "🖼️ L'image (carte) est trop lourde (max ~4 Mo). Renvoie-la en qualité réduite.", mentions: [senderJid] });
            }
            if (img?.dataUrl) opts.imageDataUrl = img.dataUrl;
        }

        const { text: reponse } = await askArbitre(duelId, action, opts);
        await sock.sendMessage(from, { text: reponse, mentions: [senderJid] });
        try { await sock.sendPresenceUpdate("paused", from); } catch (e) {}
    }
};
