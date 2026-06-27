const { loadAllUsers } = require("../utils/users");

module.exports = {
    command: "!classement",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        const db = await loadAllUsers();
        const users = Object.values(db);

        if (!users.length) {
            return sock.sendMessage(from, { text: "📭 Aucun joueur dans la base." });
        }

        users.sort((a, b) => (b.points || 0) - (a.points || 0));

        const medals = ["🥇", "🥈", "🥉"];

        let msg = `🏆 *CLASSEMENT SUL — TOP ${Math.min(10, users.length)}*\n_Consulté par @${senderNumber}_\n\n`;

        users.slice(0, 10).forEach((u, i) => {
            const medal = medals[i] || `*${i + 1}.*`;
            msg += `${medal} *${u.pseudo}* — ${u.points || 0}pts 🌟 | ${u.wins}V/${u.loses}D\n`;
        });

        msg += `\n_!fiche <pseudo> pour voir une fiche complète_`;

        await sock.sendMessage(from, { text: msg, mentions: [senderJid] });
    }
};
