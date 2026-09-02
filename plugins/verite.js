const { pick } = require("../utils/evoVoice");
const VERITES = [
    "Quel est ton plus gros mensonge jamais raconté ?",
    "Qui dans ce groupe verrais-tu bien en couple ?",
    "Quelle est la chose la plus embarrassante que tu aies faite en public ?",
    "Quel talent caché as-tu ?",
    "Quelle est ta plus grande peur ?",
    "Si tu pouvais effacer un souvenir, lequel ?",
    "Quel est le dernier truc que tu as cherché sur internet ?",
    "Quelle habitude bizarre as-tu que peu de gens connaissent ?",
];
module.exports = {
    command: "!verite",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        await sock.sendMessage(from, { text: `💬 *VÉRITÉ*\n\n@${senderNumber} :\n\n❓ ${pick(VERITES)}`, mentions: [senderJid] });
    }
};
