const { checkCanPlay, applyCasinoResult } = require("../utils/users");

const IMAGE_URL = "https://files.catbox.moe/04bcjy.jpg";
const MIN = 1;
const MAX = 20; // volontairement petit pour rester jouable en un seul message (pas d'indices multi-tours)

module.exports = {
    command: "!devine",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const args = text.replace("!devine", "").trim().split(" ");
        const nombreJoueur = parseInt(args[0]);
        const pseudo = (args[1] || "").trim();
        const mise = parseInt(args[2]);

        if (isNaN(nombreJoueur) || nombreJoueur < MIN || nombreJoueur > MAX || !pseudo || isNaN(mise) || mise <= 0) {
            return sock.sendMessage(from, {
                image: { url: IMAGE_URL },
                caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🔢 DEVINE LE NOMBRE*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👉 *!devine <nombre entre ${MIN} et ${MAX}> <pseudo> <mise>*
🎯 Bonne réponse = x${MAX} ta mise !
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
            });
        }

        const check = await checkCanPlay(pseudo, mise);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        const nombreSecret = MIN + Math.floor(Math.random() * (MAX - MIN + 1));
        const gagne = nombreJoueur === nombreSecret;
        const gain = gagne ? mise * MAX : 0;

        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        await sock.sendMessage(from, {
            image: { url: IMAGE_URL },
            caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🔢 DEVINE LE NOMBRE*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Joué par @${senderNumber}_

🎯 Mise : *${mise}🔶*
🔢 Ton nombre : *${nombreJoueur}*
🎲 Nombre secret : *${nombreSecret}*

${gagne ? `✅ *GAGNÉ !* +${gain}🔶 (x${MAX} !)` : `❌ *PERDU.* -${mise}🔶`}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💰 Nouvelle bourse de *${user.pseudo}* : *${user.money}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
