const { checkCanPlay, applyCasinoResult } = require("../utils/users");

const IMAGE_URL = "https://files.catbox.moe/42uup7.jpg";

// Roue à 37 cases comme une vraie roulette européenne :
// 18 rouges, 18 noires, 1 verte (le zéro) — le vert est donc rare
// et paie beaucoup plus en compensation.
function tournerRoue() {
    const n = Math.floor(Math.random() * 37); // 0 à 36
    if (n === 0) return "vert";
    // Alternance simplifiée rouge/noir (pas besoin de reproduire le vrai tapis)
    return n % 2 === 0 ? "noir" : "rouge";
}

const GAINS = { rouge: 2, noir: 2, vert: 14 };

module.exports = {
    command: "!roulette",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const args = text.replace("!roulette", "").trim().split(" ");
        const couleur = (args[0] || "").toLowerCase();
        const pseudo = (args[1] || "").trim();
        const mise = parseInt(args[2]);

        if (!["rouge", "noir", "vert"].includes(couleur) || !pseudo || isNaN(mise) || mise <= 0) {
            return sock.sendMessage(from, {
                image: { url: IMAGE_URL },
                caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🎡 ROULETTE*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👉 *!roulette rouge <pseudo> <mise>* (x${GAINS.rouge})
👉 *!roulette noir <pseudo> <mise>* (x${GAINS.noir})
👉 *!roulette vert <pseudo> <mise>* (x${GAINS.vert} — rare !)
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
            });
        }

        const check = await checkCanPlay(pseudo, mise);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        const resultat = tournerRoue();
        const gagne = resultat === couleur;
        const gain = gagne ? mise * GAINS[couleur] : 0;

        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        const emoji = { rouge: "🔴", noir: "⚫", vert: "🟢" };

        await sock.sendMessage(from, {
            image: { url: IMAGE_URL },
            caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🎡 ROULETTE*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Jouée par @${senderNumber}_

🎯 Mise : *${mise}🔶*
La bille tombe sur : ${emoji[resultat]} *${resultat.toUpperCase()}*
👉 Ton pari : ${emoji[couleur]} *${couleur}*

${gagne ? `✅ *GAGNÉ !* +${gain}🔶` : `❌ *PERDU.* -${mise}🔶`}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💰 Nouvelle bourse de *${user.pseudo}* : *${user.money}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
