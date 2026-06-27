const fs = require("fs");

module.exports = {
    command: "!combat",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const dbPath = "./data/combats.json";

        if (!fs.existsSync(dbPath)) {
            fs.writeFileSync(dbPath, JSON.stringify({ active: {} }, null, 2));
        }

        const db = JSON.parse(fs.readFileSync(dbPath));

        db.active[from] = {
            players: [],
            messages: [],
            status: "waiting",
            startedBy: senderNumber,
            startTime: new Date().toISOString()
        };

        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        await sock.sendMessage(from, {
            text: `⚔️ *COMBAT LANCÉ !*\n\n@${senderNumber} a ouvert l'arène !\n\nEnvoyez vos pavés de combat.\nTapez *!verdict PAVÉ1 vs PAVÉ2* quand vous êtes prêts.\n\n_🛑 !stopfight pour annuler_`,
            mentions: [senderJid]
        });
    }
};
