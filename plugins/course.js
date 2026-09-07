const { checkCanPlay, applyCasinoResult, buildInterface } = require("../utils/users");

const CHEVAUX = ["🐎 Éclair", "🐴 Tornade", "🏇 Ombre", "🐎 Comète"];

module.exports = {
    command: "!course",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const a = text.replace("!course", "").trim().split(/\s+/);
        const choix = parseInt(a[0]);
        const pseudo = a[1];
        const mise = parseInt(a[2]);

        if (isNaN(choix) || choix < 1 || choix > 4 || !pseudo || isNaN(mise) || mise <= 0) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🏇 COURSE DE CHEVAUX",
                lignes: [
                    "👉 *!course <1-4> <pseudo> <mise>*",
                    CHEVAUX.map((c, i) => `${i + 1}. ${c}`).join("\n"),
                    "Bon cheval = x3.5",
                    "",
                    "_Ex : !course 2 paul 4000_",
                ],
            }) });
        }

        const check = await checkCanPlay(pseudo, mise, "course");
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        const gagnant = Math.floor(Math.random() * 4) + 1;
        const gagne = gagnant === choix;
        const gain = gagne ? Math.round(mise * 3.5) : 0;
        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "🏇 COURSE DE CHEVAUX",
            lignes: [
                `_Parié par @${senderNumber}_`,
                `🎯 Ton cheval : *${choix}. ${CHEVAUX[choix - 1]}*`,
                `🏁 Vainqueur : *${gagnant}. ${CHEVAUX[gagnant - 1]}*`,
                "",
                gagne ? `✅ Dans le mille ! +${gain}🔶` : `❌ Perdu. -${mise}🔶`,
            ],
            footer: `💰 Bourse de *${user.pseudo}* : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
