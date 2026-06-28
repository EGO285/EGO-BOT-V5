const { checkCanPlay, applyCasinoResult } = require("../utils/users");

const IMAGE_URL = "https://files.catbox.moe/04bcjy.jpg";

const VALEURS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "V", "D", "R"];
const SYMBOLES = ["♠️", "♥️", "♦️", "♣️"];

function tirerCarte() {
    const valeur = VALEURS[Math.floor(Math.random() * VALEURS.length)];
    const symbole = SYMBOLES[Math.floor(Math.random() * SYMBOLES.length)];
    return { valeur, symbole };
}

function valeurCarte(valeur) {
    if (valeur === "A") return 11; // simplifié : As = 11 fixe (pas de double valeur 1/11)
    if (["V", "D", "R"].includes(valeur)) return 10;
    return parseInt(valeur, 10);
}

function totalMain(main) {
    return main.reduce((sum, c) => sum + valeurCarte(c.valeur), 0);
}

function afficherMain(main) {
    return main.map(c => `${c.valeur}${c.symbole}`).join(" ");
}

module.exports = {
    command: "!blackjack",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const args = text.replace("!blackjack", "").trim().split(" ");
        const pseudo = (args[0] || "").trim();
        const mise = parseInt(args[1]);

        if (!pseudo || isNaN(mise) || mise <= 0) {
            return sock.sendMessage(from, {
                image: { url: IMAGE_URL },
                caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🃏 BLACKJACK*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👉 *!blackjack <pseudo> <mise>*
🎯 Approche-toi de 21 sans le dépasser, contre le bot.
🏆 Victoire simple x2 — Blackjack (21 direct) x2.5
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
            });
        }

        const check = await checkCanPlay(pseudo, mise);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        // Le joueur tire des cartes automatiquement jusqu'à s'arrêter à >= 17
        // (version simplifiée sans interaction "tirer/rester" en plusieurs messages)
        const joueur = [tirerCarte(), tirerCarte()];
        while (totalMain(joueur) < 17) {
            joueur.push(tirerCarte());
        }

        const bot = [tirerCarte(), tirerCarte()];
        while (totalMain(bot) < 17) {
            bot.push(tirerCarte());
        }

        const totalJoueur = totalMain(joueur);
        const totalBot = totalMain(bot);

        let resultat, gain;
        const blackjackJoueur = joueur.length === 2 && totalJoueur === 21;

        if (totalJoueur > 21) {
            resultat = "❌ *PERDU.* Tu as dépassé 21 !";
            gain = 0;
        } else if (totalBot > 21) {
            resultat = "✅ *GAGNÉ !* Le bot a dépassé 21 !";
            gain = mise * 2;
        } else if (blackjackJoueur && totalBot !== 21) {
            resultat = "✅ *BLACKJACK !* 21 directement !";
            gain = Math.round(mise * 2.5);
        } else if (totalJoueur > totalBot) {
            resultat = "✅ *GAGNÉ !*";
            gain = mise * 2;
        } else if (totalJoueur === totalBot) {
            resultat = "🤝 *ÉGALITÉ.* Mise remboursée.";
            gain = mise;
        } else {
            resultat = "❌ *PERDU.*";
            gain = 0;
        }

        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        await sock.sendMessage(from, {
            image: { url: IMAGE_URL },
            caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🃏 BLACKJACK*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Joué par @${senderNumber}_

🎯 Mise : *${mise}🔶*

👤 Toi : ${afficherMain(joueur)} (*${totalJoueur}*)
🤖 Bot : ${afficherMain(bot)} (*${totalBot}*)

${resultat}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💰 Nouvelle bourse de *${user.pseudo}* : *${user.money}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
