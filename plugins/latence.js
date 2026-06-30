const chronos = require("../chronoData");

const LATENCE_GIF_URL = "https://i.postimg.cc/bJDMfyVH/076B8BED-5B01-40FF-974E-780F9A388F53.gif";
const DUREE_MS = 420000; // 7 minutes

module.exports = {
    command: "!latence",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        // Récupère le(s) joueur(s) mentionné(s) dans le message
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (!mentioned.length) {
            return sock.sendMessage(from, {
                text: "❌ Exemple : *!latence @joueur*\n_Mentionne le joueur à qui attribuer le chrono._"
            });
        }

        const targetJid = mentioned[0];
        const targetNumber = targetJid.split("@")[0].split(":")[0];

        if (!chronos.active[from]) chronos.active[from] = {};

        if (chronos.active[from][targetNumber]) {
            return sock.sendMessage(from, {
                text: `⚠️ Un chronomètre est déjà en cours pour @${targetNumber}.\n_!stop @${targetNumber} pour l'arrêter_`,
                mentions: [targetJid]
            });
        }

        await sock.sendMessage(from, {
            image: { url: LATENCE_GIF_URL },
            caption: `⏱️ @${senderNumber} lance le chronomètre !\n\n*Durée : 7 minutes*\n\n👉 Next @${targetNumber}\n\n⏸ !pause @${targetNumber} — ▶️ !go @${targetNumber} — ⏹ !stop @${targetNumber}`,
            mentions: [senderJid, targetJid]
        });

        const timeout = setTimeout(async () => {
            await sock.sendMessage(from, {
                text: `🚨 *TIME UP !*\n\n@${targetNumber} le temps est écoulé !`,
                mentions: [targetJid]
            });
            if (chronos.active[from]) delete chronos.active[from][targetNumber];
        }, DUREE_MS);

        chronos.active[from][targetNumber] = {
            timeout,
            remaining: DUREE_MS,
            start: Date.now(),
            jid: targetJid,
            number: targetNumber,
            senderJid,
            senderNumber
        };
    }
};
