const { getUser, saveUser } = require("../utils/users");

module.exports = {
    command: "!addmoney",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        const args = text.replace("!addmoney", "").trim().split(" ");
        const name = args[0]?.toLowerCase();
        const amount = parseInt(args[1]);

        if (!name || isNaN(amount)) {
            return sock.sendMessage(from, { text: "❌ Format : *!addmoney <pseudo> <montant>*\nExemple : !addmoney paul 50000" });
        }

        const user = await getUser(name);

        if (!user) {
            return sock.sendMessage(from, { text: `❌ Joueur *${name}* introuvable.` });
        }

        user.money += amount;
        await saveUser(name, user);

        return sock.sendMessage(from, {
            text: `💰 *+${amount}🔶 ajoutés à ${user.pseudo}*\n\n💰 Nouvelle bourse : *${user.money}🔶*\n_Par @${senderNumber}_`,
            mentions: [senderJid]
        });
    }
};
