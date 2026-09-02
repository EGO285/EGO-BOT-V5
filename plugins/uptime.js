const { formatDuree } = require("../utils/evoGame");
module.exports = {
    command: "!uptime",
    async handler(sock, m, text) {
        const from = m.key.remoteJid;
        const up = process.uptime() * 1000;
        const mem = Math.round(process.memoryUsage().rss / 1024 / 1024);
        await sock.sendMessage(from, {
            text: `🟢 *E.V.O — STATUT*\n\n⏱️ En ligne depuis : *${formatDuree(up)}*\n🧠 Mémoire : *${mem} Mo*\n⚡ Latence interne : OK\n\n_EGO VIRTUAL OPERATOR opérationnel._`,
        });
    }
};
