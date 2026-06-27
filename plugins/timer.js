const chronos = require("../chronoData");

module.exports = {
    command: "!timer",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        if (chronos.active[from]) {
            return sock.sendMessage(from, { text: "⚠️ Un chronomètre est déjà en cours.\n_!stop pour l'arrêter_" });
        }

        const args = text.split(" ");
        const minutes = parseInt(args[1]);

        if (!minutes || isNaN(minutes) || minutes < 1 || minutes > 60) {
            return sock.sendMessage(from, {
                text: "❌ Format : *!timer <minutes>*\n\nExemple : !timer 5\n_Min: 1 min — Max: 60 min_"
            });
        }

        const duration = minutes * 60 * 1000;

        await sock.sendMessage(from, {
            text: `⏱️ @${senderNumber} lance un chrono de *${minutes} minute(s)* !\n\n⏸ !pause — ▶️ !go — ⏹ !stop`,
            mentions: [senderJid]
        });

        const timeout = setTimeout(async () => {
            await sock.sendMessage(from, {
                text: `🚨 *TIME UP !*\n\n@${senderNumber} — *${minutes} minutes* écoulées !`,
                mentions: [senderJid]
            });
            delete chronos.active[from];
        }, duration);

        chronos.active[from] = {
            timeout,
            remaining: duration,
            start: Date.now(),
            senderJid,
            senderNumber
        };
    }
};
