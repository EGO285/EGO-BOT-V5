const { getUser, buildFiche } = require("../utils/users");

module.exports = {
    command: "!fiche",
    buildFiche,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        let name = text.replace("!fiche", "").trim().toLowerCase();

        if (!name) {
            return sock.sendMessage(from, { text: "❌ Exemple : *!fiche paul*" });
        }

        const user = await getUser(name);

        if (!user) {
            return sock.sendMessage(from, { text: `❌ Joueur *${name}* introuvable.` });
        }

        const caption = buildFiche(user) + `\n\n_Consulté par @${senderNumber}_`;

        if (user.photo) {
            return sock.sendMessage(from, {
                image: { url: user.photo },
                caption,
                mentions: [senderJid]
            });
        }

        await sock.sendMessage(from, {
            text: caption,
            mentions: [senderJid]
        });
    }
};
