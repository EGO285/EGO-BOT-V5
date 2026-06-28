const { checkCanPlay, applyCasinoResult } = require("../utils/users");

const IMAGE_URL = "https://files.catbox.moe/04bcjy.jpg";
const CHANCE_GAGNER = 0.45; // légèrement < 50% pour garder une marge maison

module.exports = {
    command: "!doubleornothing",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const args = text.replace("!doubleornothing", "").trim().split(" ");
        const pseudo = (args[0] || "").trim();
        const mise = parseInt(args[1]);

        if (!pseudo || isNaN(mise) || mise <= 0) {
            return sock.sendMessage(from, {
                image: { url: IMAGE_URL },
                caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🔁 DOUBLE OU RIEN*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👉 *!doubleornothing <pseudo> <mise>*
🎯 ~45% de chances de doubler ta mise (x2). Sinon tu perds tout.
⚠️ Risqué — joue ce que tu es prêt à perdre !
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
            });
        }

        const check = await checkCanPlay(pseudo, mise);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        const gagne = Math.random() < CHANCE_GAGNER;
        const gain = gagne ? mise * 2 : 0;

        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        await sock.sendMessage(from, {
            image: { url: IMAGE_URL },
            caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🔁 DOUBLE OU RIEN*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Joué par @${senderNumber}_

🎯 Mise : *${mise}🔶*

${gagne ? `✅ *DOUBLÉ !* +${gain}🔶` : `❌ *PERDU.* -${mise}🔶`}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💰 Nouvelle bourse de *${user.pseudo}* : *${user.money}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
