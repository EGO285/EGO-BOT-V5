const { getUser, saveUser, loadAllUsers, updateRanking, buildFiche } = require("../utils/users");

module.exports = {
    command: "!win",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        const name = text.replace("!win", "").trim().toLowerCase();
        const user = await getUser(name);

        if (!user) {
            return sock.sendMessage(from, { text: `❌ Joueur *${name}* introuvable.` });
        }

        user.wins += 1;
        user.points += 3;
        user.money += 50000;
        await saveUser(name, user);

        // Recalcule le rang de tout le monde puisque les points ont changé
        const db = await loadAllUsers();
        await updateRanking(db);

        return sock.sendMessage(from, {
            text: `🏆 *VICTOIRE ENREGISTRÉE !*\n_Par @${senderNumber}_\n\n${buildFiche(db[name])}`,
            mentions: [senderJid]
        });
    }
};
