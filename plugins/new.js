const { getUser, saveUser, buildFiche } = require("../utils/users");

module.exports = {
    command: "!new",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        const pseudo = text.replace("!new", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, { text: "❌ Exemple : *!new Paul*" });
        }

        const key = pseudo.toLowerCase();
        const existing = await getUser(key);

        if (existing) {
            return sock.sendMessage(from, { text: `❌ Le joueur *${pseudo}* existe déjà.` });
        }

        const newUser = {
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

        await saveUser(key, newUser);

        await sock.sendMessage(from, {
            text: buildFiche(newUser) + `\n\n✅ Compte créé par @${senderNumber}`,
            mentions: [senderJid]
        });
    }
};
