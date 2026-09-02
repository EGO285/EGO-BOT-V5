function score(a, b) {
    const s = (a + b).toLowerCase().replace(/\s+/g, "");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 101;
    return h; // 0..100 stable pour un même couple
}
function barre(p) {
    const n = Math.round(p / 10);
    return "█".repeat(n) + "░".repeat(10 - n);
}
module.exports = {
    command: "!ship",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const arg = text.replace("!ship", "").trim();
        const parts = arg.split(/\s+et\s+|\s+&\s+|\s*\+\s*|\s+/).filter(Boolean);
        if (parts.length < 2) {
            return sock.sendMessage(from, { text: "💘 *!ship <nom1> <nom2>*\n_Ex : !ship paul marie_" });
        }
        const a = parts[0], b = parts[1];
        const p = score(a, b);
        let verdict;
        if (p < 20) verdict = "💔 Aïe... c'est compliqué.";
        else if (p < 45) verdict = "🤔 Pourquoi pas, avec des efforts.";
        else if (p < 70) verdict = "💗 Y'a clairement un truc.";
        else if (p < 90) verdict = "💖 Duo de feu !";
        else verdict = "💞 Âmes sœurs, mariez-vous.";
        await sock.sendMessage(from, {
            text: `💘 *SHIP*\n\n*${a}* ❤️ *${b}*\n\n${barre(p)} *${p}%*\n${verdict}`,
        });
    }
};
