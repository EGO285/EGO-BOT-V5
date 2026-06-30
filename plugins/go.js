const chronos = require("../chronoData");

module.exports = {
    command: "!go",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const groupPaused = chronos.paused[from] || {};

        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        let targetNumber;
        let targetJid;

        if (mentioned.length) {
            targetJid = mentioned[0];
            targetNumber = targetJid.split("@")[0].split(":")[0];
        } else {
            const keys = Object.keys(groupPaused);
            if (keys.length === 1) {
                targetNumber = keys[0];
                targetJid = groupPaused[targetNumber].jid;
            } else if (keys.length > 1) {
                return sock.sendMessage(from, {
                    text: "❌ Plusieurs chronomètres sont en pause. Précise lequel avec *!go @joueur*."
                });
            }
        }

        if (!targetNumber || !groupPaused[targetNumber]) {
            return sock.sendMessage(from, { text: "❌ Aucun chronomètre en pause pour ce joueur." });
        }

        const { remaining, jid: origJid, number: origNum, senderJid: origSenderJid, senderNumber: origSenderNumber } = groupPaused[targetNumber];
        const remainingMin = Math.floor(remaining / 60000);
        const remainingSec = Math.floor((remaining % 60000) / 1000);

        const timeout = setTimeout(async () => {
            await sock.sendMessage(from, {
                text: `🚨 *TIME UP !*\n\n@${origNum} le temps est écoulé !`,
                mentions: [origJid]
            });
            if (chronos.active[from]) delete chronos.active[from][origNum];
        }, remaining);

        if (!chronos.active[from]) chronos.active[from] = {};
        chronos.active[from][origNum] = {
            timeout,
            remaining,
            start: Date.now(),
            jid: origJid,
            number: origNum,
            senderJid: origSenderJid,
            senderNumber: origSenderNumber
        };

        delete groupPaused[targetNumber];

        return sock.sendMessage(from, {
            text: `▶️ @${senderNumber} a relancé le chrono de @${origNum} !\n\n⏳ Temps restant : *${remainingMin}m ${remainingSec}s*`,
            mentions: [senderJid, origJid]
        });
    }
};
