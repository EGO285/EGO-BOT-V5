const { getUser, saveUser } = require("../utils/users");

module.exports = {
    command: "!reset",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        const name = text.replace("!reset", "").trim().toLowerCase();

        if (!name) {
            return sock.sendMessage(from, { text: "❌ Exemple : *!reset paul*" });
        }

        const existing = await getUser(name);

        if (!existing) {
            return sock.sendMessage(from, { text: `❌ Joueur *${name}* introuvable.` });
        }

        const pseudo = existing.pseudo;

        const resetUser = {
            pseudo,
            division: "Alpha",
            money: 0,
            stars: 0,
            cards: 0,
            wins: 0,
            loses: 0,
            points: 0,
            rank: "N/A"
        };

        await saveUser(name, resetUser);

        return sock.sendMessage(from, {
            text: `🔄 *RESET DE ${pseudo.toUpperCase()}*\n\nToutes les stats ont été remises à zéro.\n_Par @${senderNumber}_`,
            mentions: [senderJid]
        });
    }
};
