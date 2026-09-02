const { checkCanPlay, applyCasinoResult, buildInterface } = require("../utils/users");

// Zones pondérées : [libellé, multiplicateur, poids]
const ZONES = [
    ["❌ Raté", 0, 30],
    ["⚪ Anneau extérieur (x1.5)", 1.5, 35],
    ["🔵 Anneau intérieur (x2.5)", 2.5, 25],
    ["🎯 BULLSEYE (x5)", 5, 10],
];

module.exports = {
    command: "!fleche",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const a = text.replace("!fleche", "").trim().split(/\s+/);
        const pseudo = a[0];
        const mise = parseInt(a[1]);

        if (!pseudo || isNaN(mise) || mise <= 0) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🎯 FLÉCHETTES",
                lignes: [
                    "👉 *!fleche <pseudo> <mise>*",
                    "Lance ta fléchette et vise le bullseye (jusqu'à x5).",
                    "",
                    "_Ex : !fleche paul 3000_",
                ],
            }) });
        }

        const check = await checkCanPlay(pseudo, mise);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        const total = ZONES.reduce((s, z) => s + z[2], 0);
        let r = Math.random() * total;
        let zone = ZONES[0];
        for (const z of ZONES) { if (r < z[2]) { zone = z; break; } r -= z[2]; }

        const gain = Math.round(mise * zone[1]);
        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "🎯 FLÉCHETTES",
            lignes: [
                `_Lancé par @${senderNumber}_`,
                `🪃 Zone touchée : *${zone[0]}*`,
                "",
                gain > 0 ? `✅ +${gain}🔶` : `❌ Complètement à côté. -${mise}🔶`,
            ],
            footer: `💰 Bourse de *${user.pseudo}* : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
