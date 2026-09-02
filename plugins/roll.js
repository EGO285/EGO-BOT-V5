module.exports = {
    command: "!roll",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        let max = parseInt(text.replace("!roll", "").trim());
        if (isNaN(max) || max < 2) max = 100;
        if (max > 1000000) max = 1000000;
        const n = Math.floor(Math.random() * max) + 1;
        await sock.sendMessage(from, {
            text: `🎲 *ROLL 1-${max}*\n\n@${senderNumber} obtient : *${n}*`,
            mentions: [senderJid],
        });
    }
};
