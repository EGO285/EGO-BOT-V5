const { checkCanPlay, applyCasinoResult, buildInterface } = require("../utils/users");

module.exports = {
    command: "!echelle",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const a = text.replace("!echelle", "").trim().split(/\s+/);
        const pseudo = a[0];
        const mise = parseInt(a[1]);
        const niveaux = parseInt(a[2]);

        if (!pseudo || isNaN(mise) || mise <= 0 || isNaN(niveaux) || niveaux < 1 || niveaux > 6) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🪜 L'ÉCHELLE",
                lignes: [
                    "👉 *!echelle <pseudo> <mise> <niveaux 1-6>*",
                    "Grimpe l'échelle. Chaque barreau = 55% de réussite.",
                    "Plus tu montes haut, plus le gain explose (x1.8 par barreau).",
                    "Un seul faux pas et tu tombes.",
                    "",
                    "_Ex : !echelle paul 3000 4_",
                ],
            }) });
        }

        const check = await checkCanPlay(pseudo, mise);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        let atteint = 0;
        const barreaux = [];
        for (let i = 1; i <= niveaux; i++) {
            if (Math.random() < 0.55) { atteint = i; barreaux.push("🟩"); }
            else { barreaux.push("🟥"); break; }
        }

        const reussi = atteint === niveaux;
        const gain = reussi ? Math.round(mise * Math.pow(1.8, niveaux)) : 0;
        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "🪜 L'ÉCHELLE",
            lignes: [
                `_Grimpé par @${senderNumber}_`,
                `🎯 Objectif : *${niveaux} barreaux*`,
                `🧗 Progression : ${barreaux.join(" ")} (${atteint}/${niveaux})`,
                "",
                reussi ? `✅ Sommet atteint ! x${Math.pow(1.8, niveaux).toFixed(2)} → +${gain}🔶` : `❌ Chute au barreau ${atteint + 1}. -${mise}🔶`,
            ],
            footer: `💰 Bourse de *${user.pseudo}* : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
