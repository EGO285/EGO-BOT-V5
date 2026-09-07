const story = require("../story");

// Guide complet du MODE HISTOIRE (remplace "!histoire aide").
module.exports = {
    command: "!guide",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        let txt;
        try { txt = story.aide(); }
        catch (e) { txt = "⚠️ Guide indisponible pour l’instant."; }
        await sock.sendMessage(from, { text: `@${senderNumber}\n${txt}`, mentions: [senderJid] });
    }
};
