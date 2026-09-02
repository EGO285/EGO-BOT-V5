const { pick } = require("../utils/evoVoice");
const DEFIS = [
    "Envoie le dernier emoji que tu as utilisé, 5 fois de suite.",
    "Change ta photo de profil pour une image de patate pendant 10 min.",
    "Écris ton prochain message uniquement en majuscules.",
    "Raconte ton pire fou rire en 2 lignes.",
    "Fais un compliment sincère à la dernière personne qui a parlé.",
    "Parle comme un pirate pendant tes 3 prochains messages.",
    "Envoie une photo de ton bureau/chambre là, maintenant.",
    "Invente un slogan pour ce groupe.",
];
module.exports = {
    command: "!defi",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        await sock.sendMessage(from, { text: `🎯 *DÉFI*\n\n@${senderNumber}, ton défi :\n\n➡️ ${pick(DEFIS)}`, mentions: [senderJid] });
    }
};
