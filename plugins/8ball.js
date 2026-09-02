const { pick } = require("../utils/evoVoice");

const REPONSES = [
    "C'est certain.", "Sans aucun doute.", "Oui, absolument.", "Tu peux compter dessus.",
    "Probablement, oui.", "Les signes pointent vers oui.", "Peut-être bien.",
    "Difficile à dire, réessaie.", "Concentre-toi et redemande.", "Rien n'est moins sûr.",
    "N'y compte pas trop.", "Ma réponse est non.", "Très peu probable.", "Absolument pas.",
];

module.exports = {
    command: "!8ball",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const q = text.replace("!8ball", "").trim();
        if (!q) {
            return sock.sendMessage(from, { text: "🎱 Pose-moi une question fermée.\n👉 *!8ball <ta question>*\n_Ex : !8ball je vais gagner au casino ce soir ?_" });
        }
        await sock.sendMessage(from, {
            text: `🎱 *BOULE MAGIQUE*\n\n❓ ${q}\n\n🔮 ${pick(REPONSES)}\n\n_Consulté par @${senderNumber}_`,
            mentions: [senderJid],
        });
    }
};
