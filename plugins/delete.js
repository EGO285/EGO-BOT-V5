const { getUser, deleteUser } = require("../utils/users");

module.exports = {
    command: "!delete",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        let name = text.replace("!delete", "").replace("@", "").trim().toLowerCase();

        if (!name) {
            return sock.sendMessage(from, { text: "❌ Exemple : *!delete paul*" });
        }

        const user = await getUser(name);

        if (!user) {
            return sock.sendMessage(from, { text: `❌ Joueur *${name}* introuvable.` });
        }

        const pseudo = user.pseudo;
        await deleteUser(name);

        return sock.sendMessage(from, {
            text: `🗑️ *COMPTE SUPPRIMÉ*\n\n👤 Joueur : *${pseudo}*\n⚠️ Fiche supprimée par @${senderNumber}`,
            mentions: [senderJid]
        });
    }
};
