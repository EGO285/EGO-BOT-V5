function meter(seed) {
    let h = 0;
    const s = seed.toLowerCase();
    for (let i = 0; i < s.length; i++) h = (h * 17 + s.charCodeAt(i) + Math.floor(Math.random() * 3)) % 101;
    return h;
}
module.exports = {
    command: "!niveau",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const a = text.replace("!niveau", "").trim().split(/\s+/);
        const pseudo = a[0];
        const critere = a.slice(1).join(" ") || "coolitude";
        if (!pseudo) {
            return sock.sendMessage(from, { text: "📊 *!niveau <pseudo> <critère>*\n_Ex : !niveau paul chance_" });
        }
        const p = meter(pseudo + critere);
        const n = Math.round(p / 10);
        await sock.sendMessage(from, {
            text: `📊 *NIVEAU DE ${critere.toUpperCase()}*\n\n👤 ${pseudo}\n${"█".repeat(n)}${"░".repeat(10 - n)} *${p}%*`,
        });
    }
};
