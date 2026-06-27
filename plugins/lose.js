const { getUser, saveUser, loadAllUsers, updateRanking, buildFiche } = require("../utils/users");

module.exports = {
    command: "!lose",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        const name = text.replace("!lose", "").trim().toLowerCase();
        const user = await getUser(name);

        if (!user) {
            return sock.sendMessage(from, { text: `❌ Joueur *${name}* introuvable.` });
        }

        user.loses += 1;
        user.money += 10000;
        await saveUser(name, user);

        const db = await loadAllUsers();
        await updateRanking(db);

        return sock.sendMessage(from, {
            text: `💀 *DÉFAITE ENREGISTRÉE !*\n_Par @${senderNumber}_\n\n${buildFiche(db[name])}`,
            mentions: [senderJid]
        });
    }
};
