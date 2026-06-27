const chronos = require("../chronoData");

module.exports = {
    command: "!go",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        if (!chronos.paused[from]) {
            return sock.sendMessage(from, { text: "❌ Aucun chronomètre en pause." });
        }

        const { remaining, senderJid: origJid, senderNumber: origNum } = chronos.paused[from];
        const remainingMin = Math.floor(remaining / 60000);
        const remainingSec = Math.floor((remaining % 60000) / 1000);

        const timeout = setTimeout(async () => {
            await sock.sendMessage(from, {
                text: `🚨 *TIME UP !*\n\n@${origNum || senderNumber} le temps est écoulé !`,
                mentions: [origJid || senderJid]
            });
            delete chronos.active[from];
        }, remaining);

        chronos.active[from] = {
            timeout,
            remaining,
            start: Date.now(),
            senderJid: origJid || senderJid,
            senderNumber: origNum || senderNumber
        };

        delete chronos.paused[from];

        return sock.sendMessage(from, {
            text: `▶️ @${senderNumber} a relancé le chrono !\n\n⏳ Temps restant : *${remainingMin}m ${remainingSec}s*`,
            mentions: [senderJid]
        });
    }
};
