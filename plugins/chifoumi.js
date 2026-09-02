const { checkCanPlay, applyCasinoResult, buildInterface } = require("../utils/users");

const COUPS = { pierre: "✊", feuille: "✋", ciseaux: "✌️" };
const BAT = { pierre: "ciseaux", feuille: "pierre", ciseaux: "feuille" };

module.exports = {
    command: "!chifoumi",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const a = text.replace("!chifoumi", "").trim().split(/\s+/);
        const coup = (a[0] || "").toLowerCase();
        const pseudo = a[1];
        const mise = parseInt(a[2]);

        if (!COUPS[coup] || !pseudo || isNaN(mise) || mise <= 0) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "✊ CHIFOUMI",
                lignes: [
                    "👉 *!chifoumi <pierre|feuille|ciseaux> <pseudo> <mise>*",
                    "Pierre-feuille-ciseaux contre E.V.O. Victoire x1.9, égalité remboursée.",
                    "",
                    "_Ex : !chifoumi pierre paul 2000_",
                ],
            }) });
        }

        const check = await checkCanPlay(pseudo, mise);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        const bot = Object.keys(COUPS)[Math.floor(Math.random() * 3)];
        let issue, gain;
        if (coup === bot) { issue = "🤝 Égalité — mise remboursée."; gain = mise; }
        else if (BAT[coup] === bot) { issue = `✅ Gagné ! +${Math.round(mise * 1.9)}🔶`; gain = Math.round(mise * 1.9); }
        else { issue = `❌ Perdu. -${mise}🔶`; gain = 0; }

        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "✊ CHIFOUMI",
            lignes: [
                `_Joué par @${senderNumber}_`,
                `🧑 Toi : ${COUPS[coup]} ${coup}`,
                `🤖 E.V.O : ${COUPS[bot]} ${bot}`,
                "",
                issue,
            ],
            footer: `💰 Bourse de *${user.pseudo}* : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
