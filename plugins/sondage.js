module.exports = {
    command: "!sondage",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const arg = text.replace("!sondage", "").trim();
        const parts = arg.split("|").map(p => p.trim()).filter(Boolean);
        if (parts.length < 3) {
            return sock.sendMessage(from, { text: "🗳️ *!sondage <question> | <option1> | <option2> [| ...]*\n_Ex : !sondage On mange quoi ? | Pizza | Sushi | Tacos_" });
        }
        const question = parts[0];
        const options = parts.slice(1, 13);
        const emojis = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟","🇦","🇧"];
        const corps = options.map((o, i) => `${emojis[i]} ${o}`).join("\n");
        await sock.sendMessage(from, {
            text: `🗳️ *SONDAGE*\n\n❓ *${question}*\n\n${corps}\n\n_Réagis avec le chiffre correspondant. Lancé par @${senderNumber}_`,
            mentions: [senderJid],
        });
    }
};
