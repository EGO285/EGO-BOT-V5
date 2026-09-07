const { checkCanPlay, applyCasinoResult } = require("../utils/users");
const { buildInterface } = require("../utils/users");
const { pick } = require("../utils/evoVoice");

module.exports = {
    command: "!crash",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const a = text.replace("!crash", "").trim().split(/\s+/);
        const pseudo = a[0];
        const mise = parseInt(a[1]);
        const objectif = parseFloat((a[2] || "").replace(",", "."));

        if (!pseudo || isNaN(mise) || mise <= 0 || isNaN(objectif) || objectif < 1.01) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🚀 CRASH",
                lignes: [
                    "👉 *!crash <pseudo> <mise> <objectif>*",
                    "La fusée décolle, le multiplicateur monte...",
                    "Tu gagnes si elle atteint TON objectif avant d'exploser.",
                    "",
                    "_Ex : !crash paul 5000 2.0 (viser x2)_",
                ],
            }) });
        }

        const check = await checkCanPlay(pseudo, mise, "crash");
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        // Point d'explosion avec avantage maison (~3%).
        let crash = 0.97 / (1 - Math.random());
        crash = Math.max(1, Math.min(crash, 100));
        crash = Math.round(crash * 100) / 100;

        const gagne = crash >= objectif;
        const gain = gagne ? Math.round(mise * objectif) : 0;
        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "🚀 CRASH",
            lignes: [
                `_Joué par @${senderNumber}_`,
                `🎯 Objectif : *x${objectif.toFixed(2)}*`,
                `💥 La fusée a explosé à *x${crash.toFixed(2)}*`,
                "",
                gagne ? `✅ ${pick(["Cash-out réussi","Sortie parfaite","Bien joué"])} ! +${gain}🔶` : `❌ ${pick(["Trop gourmand","Explosée avant l'objectif","Ratée"])}. -${mise}🔶`,
            ],
            footer: `💰 Bourse de *${user.pseudo}* : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
