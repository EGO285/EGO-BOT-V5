module.exports = {
    command: "!heure",
    async handler(sock, m, text) {
        const from = m.key.remoteJid;
        const maintenant = new Date();
        const heure = maintenant.toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "full", timeStyle: "medium" });
        await sock.sendMessage(from, { text: `🕒 *HEURE (Paris)*\n\n${heure}` });
    }
};
