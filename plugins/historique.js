const fs = require("fs");

const dbPath = "./data/duels.json";

module.exports = {
    command: "!historique",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        if (!fs.existsSync(dbPath)) {
            return sock.sendMessage(from, { text: "❌ Aucun historique trouvé." });
        }

        const db = JSON.parse(fs.readFileSync(dbPath));

        if (!db.history || !db.history.length) {
            return sock.sendMessage(from, { text: "📭 Aucun duel enregistré pour l'instant." });
        }

        let msg = `📜 *HISTORIQUE DES DUELS*\n_Consulté par @${senderNumber}_\n\n`;

        db.history.slice(-10).reverse().forEach((d, i) => {
            msg += `*#${i + 1}*\n`;
            msg += `🥷 ${d.p1} vs ${d.p2}\n`;
            msg += `🏆 Vainqueur : *${d.winner}*\n`;
            msg += `📅 ${new Date(d.start).toLocaleString("fr-FR")}\n`;
            msg += `━━━━━━━━━━━\n`;
        });

        await sock.sendMessage(from, { text: msg, mentions: [senderJid] });
    }
};
