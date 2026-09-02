const { checkCanPlay, applyCasinoResult, buildInterface } = require("../utils/users");
const { pick } = require("../utils/evoVoice");

const COTES = ["gauche", "centre", "droite"];

module.exports = {
    command: "!penalty",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const a = text.replace("!penalty", "").trim().split(/\s+/);
        const cote = (a[0] || "").toLowerCase();
        const pseudo = a[1];
        const mise = parseInt(a[2]);

        if (!COTES.includes(cote) || !pseudo || isNaN(mise) || mise <= 0) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "⚽ PENALTY",
                lignes: [
                    "👉 *!penalty <gauche|centre|droite> <pseudo> <mise>*",
                    "Tire ! Si le gardien plonge du mauvais côté, tu marques (x2).",
                    "",
                    "_Ex : !penalty gauche paul 3000_",
                ],
            }) });
        }

        const check = await checkCanPlay(pseudo, mise);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        const gardien = COTES[Math.floor(Math.random() * 3)];
        const but = gardien !== cote;
        const gain = but ? mise * 2 : 0;
        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "⚽ PENALTY",
            lignes: [
                `_Tiré par @${senderNumber}_`,
                `🎯 Tu tires : *${cote}*`,
                `🧤 Le gardien plonge : *${gardien}*`,
                "",
                but ? `✅ ${pick(["BUUUT","Filet","Lucarne","Dans les cages"])} ! +${gain}🔶` : `❌ ${pick(["ARRÊT du gardien","Repoussé","Stoppé net"])} ! -${mise}🔶`,
            ],
            footer: `💰 Bourse de *${user.pseudo}* : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
