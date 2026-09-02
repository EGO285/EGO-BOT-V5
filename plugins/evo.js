const { askEVO } = require("../utils/evoAI");

module.exports = {
    command: "!evo",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const message = text.replace("!evo", "").trim();

        if (!message) {
            return sock.sendMessage(from, {
                text: "💬 Parle-moi ! *!evo <ton message>*\n_Ex : !evo explique-moi les règles du blackjack_\n_(tape !evo reset pour effacer notre conversation)_",
                mentions: [senderJid],
            });
        }

        // Petit indicateur "en train d'écrire" pour le côté vivant.
        try { await sock.sendPresenceUpdate("composing", from); } catch (e) {}

        const { text: reponse } = await askEVO(from, message);

        await sock.sendMessage(from, { text: reponse, mentions: [senderJid] });
        try { await sock.sendPresenceUpdate("paused", from); } catch (e) {}
    }
};
