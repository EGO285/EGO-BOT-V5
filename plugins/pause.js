const chronos = require("../chronoData");

module.exports = {
    command: "!pause",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        if (!chronos.active[from]) {
            return sock.sendMessage(from, { text: "❌ Aucun chronomètre actif." });
        }

        const chrono = chronos.active[from];
        clearTimeout(chrono.timeout);

        const elapsed = Date.now() - chrono.start;
        const remaining = chrono.remaining - elapsed;
        const remainingMin = Math.floor(remaining / 60000);
        const remainingSec = Math.floor((remaining % 60000) / 1000);

        chronos.paused[from] = {
            remaining: remaining > 0 ? remaining : 0,
            senderJid: chrono.senderJid,
            senderNumber: chrono.senderNumber
        };

        delete chronos.active[from];

        return sock.sendMessage(from, {
            text: `⏸️ @${senderNumber} a mis en pause !\n\n⏳ Temps restant : *${remainingMin}m ${remainingSec}s*\n\n▶️ !go pour reprendre`,
            mentions: [senderJid]
        });
    }
};
