const { pick } = require("../utils/evoVoice");
const COMPLIMENTS = [
    "tu as une énergie qui remonte le moral de tout le groupe.",
    "ton cerveau tourne plus vite qu'un processeur dernier cri.",
    "avec toi, même les journées grises deviennent supportables.",
    "tu es le genre de personne sur qui on peut vraiment compter.",
    "ta présence rend ce serveur clairement meilleur.",
    "tu as un style que beaucoup essaient de copier sans y arriver.",
    "ton humour devrait être classé ressource nationale.",
];
module.exports = {
    command: "!compliment",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const arg = text.replace("!compliment", "").trim();
        let cible = arg || `@${senderNumber}`;
        const mentions = [senderJid];
        if (mentioned.length) { cible = `@${mentioned[0].split("@")[0]}`; mentions.push(mentioned[0]); }
        await sock.sendMessage(from, { text: `💐 ${cible}, ${pick(COMPLIMENTS)}`, mentions });
    }
};
