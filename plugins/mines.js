const { checkCanPlay, applyCasinoResult, buildInterface } = require("../utils/users");
const { rand } = require("../utils/evoGame");

module.exports = {
    command: "!mines",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const a = text.replace("!mines", "").trim().split(/\s+/);
        const pseudo = a[0];
        const mise = parseInt(a[1]);
        let nbMines = parseInt(a[2]);
        if (isNaN(nbMines)) nbMines = 2;

        if (!pseudo || isNaN(mise) || mise <= 0 || nbMines < 1 || nbMines > 4) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "💣 MINES",
                lignes: [
                    "👉 *!mines <pseudo> <mise> [nbMines 1-4]*",
                    "5 cases, tu avances case par case.",
                    "Chaque case sûre augmente ton gain, une mine et tu perds tout.",
                    "",
                    "_Ex : !mines paul 5000 2_",
                ],
            }) });
        }

        const check = await checkCanPlay(pseudo, mise);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        const cases = [0, 1, 2, 3, 4];
        const minesPos = [];
        while (minesPos.length < nbMines) {
            const p = rand(0, 4);
            if (!minesPos.includes(p)) minesPos.push(p);
        }

        const ordre = cases.sort(() => Math.random() - 0.5);
        const stepMult = 5 / (5 - nbMines);
        let mult = 1;
        let mult_atteint = 1;
        let touche = false;
        const parcours = [];
        for (const c of ordre) {
            if (minesPos.includes(c)) {
                parcours.push("💥");
                touche = true;
                break;
            } else {
                mult *= stepMult;
                mult_atteint = mult;
                parcours.push("💎");
            }
        }

        const gagne = !touche;
        const gain = gagne ? Math.round(mise * mult_atteint * 0.97) : 0;
        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "💣 MINES",
            lignes: [
                `_Joué par @${senderNumber}_`,
                `🧨 Mines : *${nbMines}/5*`,
                `🧭 Parcours : ${parcours.join(" ")}`,
                "",
                gagne ? `✅ Terrain déminé ! Multiplicateur x${mult_atteint.toFixed(2)} → +${gain}🔶` : `❌ BOOM ! Tu as sauté. -${mise}🔶`,
            ],
            footer: `💰 Bourse de *${user.pseudo}* : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
