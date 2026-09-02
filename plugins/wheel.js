const { checkCanPlay, applyCasinoResult, buildInterface } = require("../utils/users");

// [libellé, multiplicateur, poids]
const CASES = [
    ["Perdu", 0, 30],
    ["x1.5", 1.5, 28],
    ["x2", 2, 20],
    ["x3", 3, 12],
    ["x5", 5, 7],
    ["JACKPOT x10", 10, 3],
];

module.exports = {
    command: "!wheel",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const a = text.replace("!wheel", "").trim().split(/\s+/);
        const pseudo = a[0];
        const mise = parseInt(a[1]);

        if (!pseudo || isNaN(mise) || mise <= 0) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🎡 ROUE DE LA FORTUNE",
                lignes: [
                    "👉 *!wheel <pseudo> <mise>*",
                    "Fais tourner la roue, jusqu'au JACKPOT x10 !",
                    "",
                    "_Ex : !wheel paul 5000_",
                ],
            }) });
        }

        const check = await checkCanPlay(pseudo, mise);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        const total = CASES.reduce((s, c) => s + c[2], 0);
        let r = Math.random() * total;
        let sel = CASES[0];
        for (const c of CASES) { if (r < c[2]) { sel = c; break; } r -= c[2]; }

        const gain = Math.round(mise * sel[1]);
        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "🎡 ROUE DE LA FORTUNE",
            lignes: [
                `_Tournée par @${senderNumber}_`,
                `🎡 La roue s'arrête sur : *${sel[0]}*`,
                "",
                gain > 0 ? `✅ +${gain}🔶` : `❌ La roue t'a trahi. -${mise}🔶`,
            ],
            footer: `💰 Bourse de *${user.pseudo}* : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
