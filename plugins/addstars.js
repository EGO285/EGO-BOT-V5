const { getUser, saveUser } = require("../utils/users");

module.exports = {
    command: "!addstars",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        const args = text.replace("!addstars", "").trim().split(" ");
        const name = args[0]?.toLowerCase();
        const amount = parseInt(args[1]);

        if (!name || isNaN(amount)) {
            return sock.sendMessage(from, { text: "❌ Format : *!addstars <pseudo> <montant>*\nExemple : !addstars paul 5" });
        }

        const user = await getUser(name);

        if (!user) {
            return sock.sendMessage(from, { text: `❌ Joueur *${name}* introuvable.` });
        }

        user.stars += amount;
        await saveUser(name, user);

        return sock.sendMessage(from, {
            text: `⭐ *+${amount}⭐ ajoutées à ${user.pseudo}*\n\n⭐ Total stars : *${user.stars}⭐*\n_Par @${senderNumber}_`,
            mentions: [senderJid]
        });
    }
};
