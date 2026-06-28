const { checkCanPlay, applyCasinoResult } = require("../utils/users");

const IMAGE_URL = "https://files.catbox.moe/mkpztr.jpg";

// Variante simplifiée du craps :
// - Premier lancer (2 dés) :
//     7 ou 11  -> victoire immédiate (x2)
//     2, 3, 12 -> défaite immédiate ("craps")
//     autre    -> ce total devient le "point", on relance
// - Relances jusqu'à retomber sur le point (victoire x3, car plus rare)
//   ou sur un 7 (défaite)
function lancerDes() {
    const d1 = 1 + Math.floor(Math.random() * 6);
    const d2 = 1 + Math.floor(Math.random() * 6);
    return { d1, d2, total: d1 + d2 };
}

module.exports = {
    command: "!craps",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const args = text.replace("!craps", "").trim().split(" ");
        const pseudo = (args[0] || "").trim();
        const mise = parseInt(args[1]);

        if (!pseudo || isNaN(mise) || mise <= 0) {
            return sock.sendMessage(from, {
                image: { url: IMAGE_URL },
                caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🎲 CRAPS*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👉 *!craps <pseudo> <mise>*
🎯 7 ou 11 au 1er lancer = victoire (x2)
❌ 2, 3 ou 12 au 1er lancer = défaite
🔁 Sinon, relance jusqu'au point (x3) ou un 7 (défaite)
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
            });
        }

        const check = await checkCanPlay(pseudo, mise);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        const historique = [];
        const premier = lancerDes();
        historique.push(premier);

        let gagne = false;
        let gain = 0;
        let resultatTexte = "";

        if (premier.total === 7 || premier.total === 11) {
            gagne = true;
            gain = mise * 2;
            resultatTexte = `✅ *GAGNÉ !* Premier lancer = ${premier.total} (naturel)`;
        } else if ([2, 3, 12].includes(premier.total)) {
            gagne = false;
            resultatTexte = `❌ *PERDU.* Premier lancer = ${premier.total} (craps)`;
        } else {
            const point = premier.total;
            let relances = 0;
            let resultatFinal = null;

            while (relances < 10 && resultatFinal === null) {
                const r = lancerDes();
                historique.push(r);
                relances++;

                if (r.total === point) {
                    resultatFinal = "point";
                } else if (r.total === 7) {
                    resultatFinal = "sept";
                }
            }

            if (resultatFinal === "point") {
                gagne = true;
                gain = mise * 3;
                resultatTexte = `✅ *GAGNÉ !* Le point (${point}) est retombé après ${relances} relance(s) !`;
            } else {
                gagne = false;
                resultatTexte = `❌ *PERDU.* Un 7 est tombé avant de refaire ${point}.`;
            }
        }

        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        const detailLancers = historique.map((l, i) => `🎲${l.d1}+🎲${l.d2} = *${l.total}*`).join("\n");

        await sock.sendMessage(from, {
            image: { url: IMAGE_URL },
            caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🎲 CRAPS*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Joué par @${senderNumber}_

🎯 Mise : *${mise}🔶*
${detailLancers}

${resultatTexte}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💰 Nouvelle bourse de *${user.pseudo}* : *${user.money}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
