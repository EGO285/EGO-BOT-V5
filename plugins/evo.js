const { evoChat } = require("../utils/evoVoice");
module.exports = {
    command: "!evo",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const message = text.replace("!evo", "").trim();
        await sock.sendMessage(from, { text: evoChat(message), mentions: [senderJid] });
    }
};
