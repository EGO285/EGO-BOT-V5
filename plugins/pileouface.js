const { pick } = require("../utils/evoVoice");
module.exports = {
    command: "!pileouface",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const res = Math.random() < 0.5 ? "🪙 PILE" : "🪙 FACE";
        await sock.sendMessage(from, {
            text: `${pick(["Je lance la pièce", "Hop, en l'air", "Ça tourne"])}...\n\n*${res}*\n\n_Lancé par @${senderNumber}_`,
            mentions: [senderJid],
        });
    }
};
