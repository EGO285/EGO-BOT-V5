const { pick } = require("../utils/evoVoice");
const SIGNES = ["belier","taureau","gemeaux","cancer","lion","vierge","balance","scorpion","sagittaire","capricorne","verseau","poissons"];
const AMOUR = ["une rencontre inattendue", "un rapprochement", "de la tendresse", "un moment à deux", "un peu de patience côté cœur"];
const ARGENT = ["une rentrée d'argent", "de la prudence sur tes dépenses", "une bonne opportunité", "un gain au jeu (essaie !casino 😉)", "de la stabilité"];
const HUMEUR = ["une énergie de feu", "du calme et de la sérénité", "une motivation en béton", "besoin de repos", "une créativité débordante"];
module.exports = {
    command: "!horoscope",
    async handler(sock, m, text) {
        const from = m.key.remoteJid;
        const signe = text.replace("!horoscope", "").trim().toLowerCase();
        if (!SIGNES.includes(signe)) {
            return sock.sendMessage(from, { text: `🔮 *!horoscope <signe>*\nSignes : ${SIGNES.join(", ")}` });
        }
        await sock.sendMessage(from, {
            text: `🔮 *HOROSCOPE — ${signe.toUpperCase()}*\n\n❤️ Amour : ${pick(AMOUR)}.\n💰 Argent : ${pick(ARGENT)}.\n✨ Humeur : ${pick(HUMEUR)}.\n\n_Les astres selon E.V.O._`,
        });
    }
};
