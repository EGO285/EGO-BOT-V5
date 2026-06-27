const chronos = require("../chronoData");

module.exports = {
    command: "!latence",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        if (chronos.active[from]) {
            return sock.sendMessage(from, { text: "⚠️ Un chronomètre est déjà en cours.\n_!stop pour l'arrêter_" });
        }

        await sock.sendMessage(from, {
            text: `⏱️ @${senderNumber} lance le chronomètre !\n\n*Durée : 7 minutes*\n\n⏸ !pause — ▶️ !go — ⏹ !stop`,
            mentions: [senderJid]
        });

        const duration = 420000; // 7 min

        const timeout = setTimeout(async () => {
            await sock.sendMessage(from, {
                text: `🚨 *TIME UP !*\n\n@${senderNumber} le temps est écoulé !`,
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
