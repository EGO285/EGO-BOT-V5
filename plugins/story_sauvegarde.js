const story = require("../story");

module.exports = {
    command: "!sauvegarde",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const arg = text.replace(/^\!sauvegarde/i, "").trim();
        try { await sock.sendPresenceUpdate("composing", from); } catch (e) {}
        let res;
        try {
            res = await story.runSub(senderNumber, "sauvegarde", arg);
        } catch (e) {
            console.error("⚠️ Mode Histoire erreur :", e);
            res = { text: "⚠️ Une secousse dans le flux du chakra a interrompu l’action. Ta progression est sauvegardée — réessaie." };
        }
        await sock.sendMessage(from, { text: `@${senderNumber}\n${res.text}`, mentions: [senderJid] });
        try { await sock.sendPresenceUpdate("paused", from); } catch (e) {}
    }
};
