const { checkCanPlay, applyCasinoResult } = require("../utils/users");

const GAIN_MULTIPLIER = 1.8;
const IMAGE_URL = "https://files.catbox.moe/v49xxu.jpg";

const VALEURS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "V", "D", "R", "A"];
const SYMBOLES = ["♠️", "♥️", "♦️", "♣️"];

function tirerCarte() {
    const valeur = VALEURS[Math.floor(Math.random() * VALEURS.length)];
    const symbole = SYMBOLES[Math.floor(Math.random() * SYMBOLES.length)];
    return { valeur, symbole, rang: VALEURS.indexOf(valeur) };
}

module.exports = {
    command: "!hl",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const args = text.replace("!hl", "").trim().split(" ");
        const choix = (args[0] || "").toLowerCase();
        const pseudo = (args[1] || "").trim();
        const mise = parseInt(args[2]);

        if (!["plus", "moins"].includes(choix) || !pseudo || isNaN(mise) || mise <= 0) {
            return sock.sendMessage(from, {
                image: { url: IMAGE_URL },
                caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🃏 HIGHER/LOWER*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👉 *!hl plus <pseudo> <mise>* — la prochaine carte sera plus haute
👉 *!hl moins <pseudo> <mise>* — la prochaine carte sera plus basse
💰 Gain : x${GAIN_MULTIPLIER}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
            });
        }

        const check = await checkCanPlay(pseudo, mise);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        const carte1 = tirerCarte();
        let carte2 = tirerCarte();
        // Si égalité parfaite, on retire pour éviter un cas ambigu (ni plus haut ni plus bas)
        while (carte2.rang === carte1.rang) {
            carte2 = tirerCarte();
        }

        const estPlusHaute = carte2.rang > carte1.rang;
        const gagne = (choix === "plus" && estPlusHaute) || (choix === "moins" && !estPlusHaute);
        const gain = gagne ? Math.round(mise * GAIN_MULTIPLIER) : 0;

        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        await sock.sendMessage(from, {
            image: { url: IMAGE_URL },
            caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🃏 HIGHER/LOWER*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Joué par @${senderNumber}_

🎯 Mise : *${mise}🔶*
Carte de départ : *${carte1.valeur}${carte1.symbole}*
👉 Ton pari : la suivante sera *${choix === "plus" ? "plus haute" : "plus basse"}*

Carte tirée : *${carte2.valeur}${carte2.symbole}*

${gagne ? `✅ *GAGNÉ !* +${gain}🔶` : `❌ *PERDU.* -${mise}🔶`}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💰 Nouvelle bourse de *${user.pseudo}* : *${user.money}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
