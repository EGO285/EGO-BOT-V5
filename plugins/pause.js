const chronos = require("../chronoData");

module.exports = {
    command: "!pause",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const groupActive = chronos.active[from] || {};

        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        let targetNumber;
        let targetJid;

        if (mentioned.length) {
            targetJid = mentioned[0];
            targetNumber = targetJid.split("@")[0].split(":")[0];
        } else {
            const keys = Object.keys(groupActive);
            if (keys.length === 1) {
                targetNumber = keys[0];
                targetJid = groupActive[targetNumber].jid;
            } else if (keys.length > 1) {
                return sock.sendMessage(from, {
                    text: "❌ Plusieurs chronomètres sont actifs. Précise lequel avec *!pause @joueur*."
                });
            }
        }

        if (!targetNumber || !groupActive[targetNumber]) {
            return sock.sendMessage(from, { text: "❌ Aucun chronomètre actif pour ce joueur." });
        }

        const chrono = groupActive[targetNumber];
        clearTimeout(chrono.timeout);

        const elapsed = Date.now() - chrono.start;
        const remaining = chrono.remaining - elapsed;
        const remainingMin = Math.floor(remaining / 60000);
        const remainingSec = Math.floor((remaining % 60000) / 1000);

        if (!chronos.paused[from]) chronos.paused[from] = {};
        chronos.paused[from][targetNumber] = {
            remaining: remaining > 0 ? remaining : 0,
            jid: chrono.jid,
            number: chrono.number,
            senderJid: chrono.senderJid,
            senderNumber: chrono.senderNumber
        };

        delete groupActive[targetNumber];

        return sock.sendMessage(from, {
            text: `⏸️ @${senderNumber} a mis en pause le chrono de @${targetNumber} !\n\n⏳ Temps restant : *${remainingMin}m ${remainingSec}s*\n\n▶️ !go @${targetNumber} pour reprendre`,
            mentions: [senderJid, targetJid]
        });
    }
};
