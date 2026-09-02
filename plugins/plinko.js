const { checkCanPlay, applyCasinoResult, buildInterface } = require("../utils/users");

// Slots du bas (multiplicateurs), le centre est le plus probable.
const SLOTS = [5, 2, 1, 0.5, 0.2, 0.5, 1, 2, 5];

module.exports = {
    command: "!plinko",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const a = text.replace("!plinko", "").trim().split(/\s+/);
        const pseudo = a[0];
        const mise = parseInt(a[1]);

        if (!pseudo || isNaN(mise) || mise <= 0) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🔴 PLINKO",
                lignes: [
                    "👉 *!plinko <pseudo> <mise>*",
                    "Lâche la bille : elle rebondit et tombe dans une case.",
                    "Bords = gros gains (x5), centre = petites pertes.",
                    "",
                    "_Ex : !plinko paul 3000_",
                ],
            }) });
        }

        const check = await checkCanPlay(pseudo, mise);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        // 8 rebonds gauche/droite -> position 0..8 (loi binomiale, centrée).
        let pos = 0;
        for (let i = 0; i < 8; i++) pos += Math.random() < 0.5 ? 0 : 1;

        const mult = SLOTS[pos];
        const gain = Math.round(mise * mult);
        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        const ligne = SLOTS.map((s, i) => (i === pos ? "🔴" : "▫️")).join("");

        await sock.sendMessage(from, { text: buildInterface({
            titre: "🔴 PLINKO",
            lignes: [
                `_Lâché par @${senderNumber}_`,
                ligne,
                `🎯 Case : *x${mult}*`,
                "",
                gain >= mise ? `✅ +${gain}🔶` : `➖ Retour partiel : +${gain}🔶 (mise ${mise}🔶)`,
            ],
            footer: `💰 Bourse de *${user.pseudo}* : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
