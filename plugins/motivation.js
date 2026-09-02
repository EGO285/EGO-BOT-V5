const { pick } = require("../utils/evoVoice");
const LIGNES = [
    "Lève-toi et avance : chaque petit pas compte.",
    "Tu es plus proche du but que tu ne le crois. Continue.",
    "Les excuses ne construisent rien. L'action, si.",
    "Discipline > motivation. Fais-le, même sans envie.",
    "Ton futur toi te remerciera pour ce que tu fais aujourd'hui.",
    "Échouer, c'est juste apprendre plus vite. Recommence.",
    "Concentre-toi sur le progrès, pas sur la perfection.",
    "Personne ne va le faire à ta place. Alors go.",
];
module.exports = {
    command: "!motivation",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        await sock.sendMessage(from, { text: `🔥 *MOTIVATION*\n\n${pick(LIGNES)}\n\n_Pour @${senderNumber}_`, mentions: [senderJid] });
    }
};
