const chronos = require("../chronoData");

module.exports = {
    command: "!stop",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const groupActive = chronos.active[from] || {};
        const groupPaused = chronos.paused[from] || {};

        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        let targetNumber;
        let targetJid;

        if (mentioned.length) {
            targetJid = mentioned[0];
            targetNumber = targetJid.split("@")[0].split(":")[0];
        } else {
            const keys = [...new Set([...Object.keys(groupActive), ...Object.keys(groupPaused)])];
            if (keys.length === 1) {
                targetNumber = keys[0];
                targetJid = (groupActive[targetNumber] || groupPaused[targetNumber]).jid;
            } else if (keys.length > 1) {
                return sock.sendMessage(from, {
                    text: "❌ Plusieurs chronomètres sont actifs. Précise lequel avec *!stop @joueur*."
                });
            }
        }

        if (!targetNumber || (!groupActive[targetNumber] && !groupPaused[targetNumber])) {
            return sock.sendMessage(from, { text: "❌ Aucun chronomètre actif pour ce joueur." });
        }

        if (groupActive[targetNumber]) clearTimeout(groupActive[targetNumber].timeout);
        delete groupActive[targetNumber];
        delete groupPaused[targetNumber];

        return sock.sendMessage(from, {
            text: `⏹️ @${senderNumber} a arrêté le chrono de @${targetNumber} !`,
            mentions: [senderJid, targetJid]
        });
    }
};
