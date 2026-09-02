const { active, QUESTIONS } = require("../utils/quizState");
const { pick } = require("../utils/evoVoice");

module.exports = {
    command: "!quiz",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const en_cours = active[from];
        if (en_cours && en_cours.expire > Date.now()) {
            return sock.sendMessage(from, { text: `⏳ Une question est déjà en cours :\n\n❓ *${en_cours.question}*\n\nRéponds avec *!rep <réponse>*.` });
        }
        const q = pick(QUESTIONS);
        active[from] = { question: q.q, reponse: q.r, expire: Date.now() + 90 * 1000 };
        await sock.sendMessage(from, {
            text: `🧠 *QUIZ E.V.O*\n\n❓ ${q.q}\n\n⏱️ Tu as 90 secondes.\n👉 Réponds avec *!rep <ta réponse>*`,
        });
    }
};
