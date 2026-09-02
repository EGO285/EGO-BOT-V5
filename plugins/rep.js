const { active } = require("../utils/quizState");

function norm(s) {
    return (s || "").toLowerCase().trim().replace(/[.!?]/g, "");
}

module.exports = {
    command: "!rep",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const rep = text.replace("!rep", "").trim();
        const partie = active[from];

        if (!partie) {
            return sock.sendMessage(from, { text: "❓ Aucun quiz en cours. Lance *!quiz* pour démarrer." });
        }
        if (partie.expire < Date.now()) {
            delete active[from];
            return sock.sendMessage(from, { text: "⌛ Trop tard, le temps est écoulé ! Relance *!quiz*." });
        }
        if (!rep) {
            return sock.sendMessage(from, { text: "👉 *!rep <ta réponse>*" });
        }

        const bon = partie.reponse.some(r => norm(r) === norm(rep));
        if (bon) {
            const bonneRep = partie.reponse[0];
            delete active[from];
            return sock.sendMessage(from, { text: `✅ Bravo @${senderNumber} ! *${bonneRep}* était la bonne réponse. 🎉`, mentions: [senderJid] });
        }
        await sock.sendMessage(from, { text: `❌ @${senderNumber} — "${rep}" n'est pas la bonne réponse. Retente !`, mentions: [senderJid] });
    }
};
