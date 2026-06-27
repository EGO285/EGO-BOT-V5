const fs = require("fs");

module.exports = {
    command: "!stopfight",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const dbPath = "./data/combats.json";

        if (!fs.existsSync(dbPath)) {
            return sock.sendMessage(from, { text: "❌ Aucun combat en cours." });
        }

        const db = JSON.parse(fs.readFileSync(dbPath));

        if (!db.active[from]) {
            return sock.sendMessage(from, { text: "❌ Aucun combat en cours dans ce chat." });
        }

        delete db.active[from];
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        await sock.sendMessage(from, {
            text: `🛑 @${senderNumber} a annulé le combat.\n\n_Utilisez !combat pour en démarrer un nouveau._`,
            mentions: [senderJid]
        });
    }
};
