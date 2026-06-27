const { getUser, loadAllUsers } = require("../utils/users");

module.exports = {
    command: "!rang",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        const name = text.replace("!rang", "").trim().toLowerCase();

        if (!name) {
            return sock.sendMessage(from, { text: "❌ Exemple : *!rang paul*" });
        }

        const u = await getUser(name);

        if (!u) {
            return sock.sendMessage(from, { text: `❌ Joueur *${name}* introuvable.` });
        }

        const db = await loadAllUsers();
        const total = Object.keys(db).length;

        await sock.sendMessage(from, {
            text:
`🏅 *RANG DE ${u.pseudo.toUpperCase()}*
_Consulté par @${senderNumber}_

📊 Rang actuel : *${u.rank || "N/A"}ème* / ${total} joueurs
🌟 Points : *${u.points || 0}*
🏆 Victoires : *${u.wins}*
💀 Défaites : *${u.loses}*
💰 Bourse : *${u.money}🔶*`,
            mentions: [senderJid]
        });
    }
};
