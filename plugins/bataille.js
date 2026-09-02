const { checkCanPlay, applyCasinoResult, buildInterface } = require("../utils/users");

const FIGURES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const COULEURS = ["♠️", "♥️", "♦️", "♣️"];

function tirer() {
    const v = Math.floor(Math.random() * FIGURES.length);
    return { v, txt: FIGURES[v] + COULEURS[Math.floor(Math.random() * 4)] };
}

module.exports = {
    command: "!bataille",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const a = text.replace("!bataille", "").trim().split(/\s+/);
        const pseudo = a[0];
        const mise = parseInt(a[1]);

        if (!pseudo || isNaN(mise) || mise <= 0) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🃏 BATAILLE",
                lignes: [
                    "👉 *!bataille <pseudo> <mise>*",
                    "Une carte pour toi, une pour E.V.O. La plus haute gagne (x1.9).",
                    "",
                    "_Ex : !bataille paul 3000_",
                ],
            }) });
        }

        const check = await checkCanPlay(pseudo, mise);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        const toi = tirer();
        const bot = tirer();
        let issue, gain;
        if (toi.v > bot.v) { gain = Math.round(mise * 1.9); issue = `✅ Ta carte l'emporte ! +${gain}🔶`; }
        else if (toi.v === bot.v) { gain = mise; issue = "🤝 Égalité — mise remboursée."; }
        else { gain = 0; issue = `❌ E.V.O gagne la bataille. -${mise}🔶`; }

        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "🃏 BATAILLE",
            lignes: [
                `_Joué par @${senderNumber}_`,
                `🧑 Toi : *${toi.txt}*`,
                `🤖 E.V.O : *${bot.txt}*`,
                "",
                issue,
            ],
            footer: `💰 Bourse de *${user.pseudo}* : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
