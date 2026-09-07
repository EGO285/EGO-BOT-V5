const story = require("../story");

module.exports = {
    command: "!histoire",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        // "!histoire <sous-commande> <arguments...>"
        const reste = text.replace(/^!histoire/i, "").trim();
        const parts = reste.split(/\s+/).filter(Boolean);
        const sub = (parts.shift() || "").toLowerCase();
        const arg = parts.join(" ");

        try { await sock.sendPresenceUpdate("composing", from); } catch (e) {}

        let res;
        try {
            res = await story.run({ sender: senderNumber, sub, arg });
        } catch (e) {
            console.error("⚠️ Mode Histoire erreur :", e);
            res = { text: "⚠️ Une secousse dans le flux du chakra a interrompu l'action. Ta progression est sauvegardée — réessaie." };
        }

        await sock.sendMessage(from, { text: res.text, mentions: [senderJid] });
        try { await sock.sendPresenceUpdate("paused", from); } catch (e) {}
    }
};
