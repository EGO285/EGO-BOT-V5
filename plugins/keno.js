const { checkCanPlay, applyCasinoResult, buildInterface } = require("../utils/users");

const GAINS = { 0: 0, 1: 1, 2: 3, 3: 12 };

module.exports = {
    command: "!keno",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const a = text.replace("!keno", "").trim().split(/\s+/).filter(Boolean);
        const pseudo = a[0];
        const mise = parseInt(a[1]);
        const nums = a.slice(2).map(n => parseInt(n)).filter(n => !isNaN(n) && n >= 1 && n <= 10);
        const choix = [...new Set(nums)].slice(0, 3);

        if (!pseudo || isNaN(mise) || mise <= 0 || choix.length < 1) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🔢 KENO",
                lignes: [
                    "👉 *!keno <pseudo> <mise> <n1> [n2] [n3]*",
                    "Choisis 1 à 3 numéros (1-10). 5 numéros sont tirés.",
                    "1 bon = x1 · 2 bons = x3 · 3 bons = x12",
                    "",
                    "_Ex : !keno paul 2000 3 7 9_",
                ],
            }) });
        }

        const check = await checkCanPlay(pseudo, mise);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        const pool = Array.from({ length: 10 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
        const tirage = pool.slice(0, 5).sort((x, y) => x - y);
        const bons = choix.filter(n => tirage.includes(n));

        const gain = Math.round(mise * (GAINS[bons.length] || 0));
        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "🔢 KENO",
            lignes: [
                `_Joué par @${senderNumber}_`,
                `🎯 Tes numéros : *${choix.join(", ")}*`,
                `🎱 Tirage : *${tirage.join(", ")}*`,
                `✔️ Bons numéros : *${bons.length}* (${bons.join(", ") || "aucun"})`,
                "",
                gain > 0 ? `✅ +${gain}🔶` : `❌ Pas de gain. -${mise}🔶`,
            ],
            footer: `💰 Bourse de *${user.pseudo}* : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
