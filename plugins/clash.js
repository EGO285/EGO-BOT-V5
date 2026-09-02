const { pick } = require("../utils/evoVoice");
const CLASHS = [
    "ton ping est plus élevé que ton QI, et pourtant tu lag.",
    "même une calculatrice cassée compte mieux que toi.",
    "t'es la preuve vivante qu'on peut respirer sans réfléchir.",
    "ton style est tellement daté qu'il buffer.",
    "tu joues au casino comme tu gères ta vie : tout en pertes.",
    "on t'a mis en 240p, pour cacher les détails.",
    "t'es pas mauvais, t'es juste... constamment en mode démo.",
];
module.exports = {
    command: "!clash",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const arg = text.replace("!clash", "").trim();
        let cible = arg || "toi";
        const mentions = [];
        if (mentioned.length) { cible = `@${mentioned[0].split("@")[0]}`; mentions.push(mentioned[0]); }
        await sock.sendMessage(from, { text: `🔥 *CLASH* (pour rire 😏)\n\n${cible}, ${pick(CLASHS)}`, mentions });
    }
};
