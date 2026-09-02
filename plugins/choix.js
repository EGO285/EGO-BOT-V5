const { pick } = require("../utils/evoVoice");
module.exports = {
    command: "!choix",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const arg = text.replace("!choix", "").trim();
        const options = arg.split(/\s*(?:\||,|\bou\b)\s*/i).map(o => o.trim()).filter(Boolean);
        if (options.length < 2) {
            return sock.sendMessage(from, { text: "🤔 *!choix <option1> | <option2> | ...*\n_Ex : !choix pizza | sushi | tacos_" });
        }
        const choisi = pick(options);
        await sock.sendMessage(from, {
            text: `🤔 *E.V.O CHOISIT*\n\n${options.map(o => (o === choisi ? `👉 *${o}*` : `▫️ ${o}`)).join("\n")}\n\nMa décision : *${choisi}*`,
        });
    }
};
