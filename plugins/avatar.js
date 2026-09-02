module.exports = {
    command: "!avatar",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const cibleJid = mentioned[0] || senderJid;
        const num = cibleJid.split("@")[0];
        try {
            const url = await sock.profilePictureUrl(cibleJid, "image");
            await sock.sendMessage(from, { image: { url }, caption: `🖼️ Photo de profil de @${num}`, mentions: [cibleJid] });
        } catch (e) {
            await sock.sendMessage(from, { text: `❌ Impossible de récupérer la photo de @${num} (privée ou inexistante).`, mentions: [cibleJid] });
        }
    }
};
