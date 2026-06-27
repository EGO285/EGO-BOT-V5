const chronos = require("../chronoData");

module.exports = {
    command: "!stop",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        if (!chronos.active[from] && !chronos.paused[from]) {
            return sock.sendMessage(from, { text: "❌ Aucun chronomètre actif." });
        }

        if (chronos.active[from]) clearTimeout(chronos.active[from].timeout);
        delete chronos.active[from];
        delete chronos.paused[from];

        return sock.sendMessage(from, {
            text: `⏹️ @${senderNumber} a arrêté le chronomètre !`,
            mentions: [senderJid]
        });
    }
};
