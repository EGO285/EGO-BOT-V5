const { checkCanPlay, applyCasinoResult, buildInterface } = require("../utils/users");

// symbole -> multiplicateur si 3 identiques ; poids de tirage
const SYMBOLES = [
    ["🍒", 3, 30],
    ["🔔", 5, 22],
    ["⭐", 8, 15],
    ["💎", 15, 8],
    ["7️⃣", 30, 4],
];

function tirer() {
    const total = SYMBOLES.reduce((s, x) => s + x[2], 0);
    let r = Math.random() * total;
    for (const x of SYMBOLES) { if (r < x[2]) return x; r -= x[2]; }
    return SYMBOLES[0];
}

module.exports = {
    command: "!grattage",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const a = text.replace("!grattage", "").trim().split(/\s+/);
        const pseudo = a[0];
        const mise = parseInt(a[1]);

        if (!pseudo || isNaN(mise) || mise <= 0) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🎫 TICKET À GRATTER",
                lignes: [
                    "👉 *!grattage <pseudo> <mise>*",
                    "Gratte 3 cases : trois symboles identiques = jackpot.",
                    SYMBOLES.map(s => `${s[0]} x${s[1]}`).join("   "),
                    "",
                    "_Ex : !grattage paul 2000_",
                ],
            }) });
        }

        const check = await checkCanPlay(pseudo, mise);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        const t = [tirer(), tirer(), tirer()];
        const gagne = t[0][0] === t[1][0] && t[1][0] === t[2][0];
        const gain = gagne ? mise * t[0][1] : 0;
        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "🎫 TICKET À GRATTER",
            lignes: [
                `_Gratté par @${senderNumber}_`,
                `🎰 [ ${t[0][0]} | ${t[1][0]} | ${t[2][0]} ]`,
                "",
                gagne ? `✅ JACKPOT ${t[0][0]} x${t[0][1]} ! +${gain}🔶` : `❌ Pas de combinaison. -${mise}🔶`,
            ],
            footer: `💰 Bourse de *${user.pseudo}* : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
