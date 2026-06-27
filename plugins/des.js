const { checkCanPlay, applyCasinoResult } = require("../utils/users");

const IMAGE_URL = "https://files.catbox.moe/mkpztr.jpg";

// Gains différents selon la probabilité réelle de chaque pari
// (sur 2 dés à 6 faces, faire exactement 7 est plus fréquent que +7 ou -7 pris isolément,
// donc le pari "exact" paie moins que les paris "plus/moins")
const GAINS = {
    plus: 1.8,   // somme > 7
    moins: 1.8,  // somme < 7
    exact: 4,    // somme === 7
};

module.exports = {
    command: "!des",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const args = text.replace("!des", "").trim().split(" ");
        const pari = (args[0] || "").toLowerCase();
        const pseudo = (args[1] || "").trim();
        const mise = parseInt(args[2]);

        if (!["plus", "moins", "exact"].includes(pari) || !pseudo || isNaN(mise) || mise <= 0) {
            return sock.sendMessage(from, {
                image: { url: IMAGE_URL },
                caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🎲 DÉS*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👉 *!des plus <pseudo> <mise>* — somme > 7 (x${GAINS.plus})
👉 *!des moins <pseudo> <mise>* — somme < 7 (x${GAINS.moins})
👉 *!des exact <pseudo> <mise>* — somme = 7 (x${GAINS.exact})
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
            });
        }

        const check = await checkCanPlay(pseudo, mise);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        const d1 = 1 + Math.floor(Math.random() * 6);
        const d2 = 1 + Math.floor(Math.random() * 6);
        const somme = d1 + d2;

        let gagne = false;
        if (pari === "plus" && somme > 7) gagne = true;
        if (pari === "moins" && somme < 7) gagne = true;
        if (pari === "exact" && somme === 7) gagne = true;

        const gain = gagne ? Math.round(mise * GAINS[pari]) : 0;
        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        await sock.sendMessage(from, {
            image: { url: IMAGE_URL },
            caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🎲 DÉS*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Joué par @${senderNumber}_

🎯 Mise : *${mise}🔶*
🎲 ${d1} + 🎲 ${d2} = *${somme}*
👉 Ton pari : *${pari}*

${gagne ? `✅ *GAGNÉ !* +${gain}🔶` : `❌ *PERDU.* -${mise}🔶`}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💰 Nouvelle bourse de *${user.pseudo}* : *${user.money}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
