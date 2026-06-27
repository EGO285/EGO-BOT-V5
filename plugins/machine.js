const { checkCanPlay, applyCasinoResult } = require("../utils/users");

const SYMBOLES = ["🍒", "🍋", "🔔", "⭐", "💎"];
const IMAGE_URL = "https://files.catbox.moe/0jx60o.jpg";

function tirer() {
    return [0, 0, 0].map(() => SYMBOLES[Math.floor(Math.random() * SYMBOLES.length)]);
}

function calculerGain(rouleau, mise) {
    const [a, b, c] = rouleau;

    // Jackpot : trois 💎 identiques
    if (a === "💎" && b === "💎" && c === "💎") {
        return { gain: mise * 10, label: "💎💎💎 JACKPOT ABSOLU !" };
    }
    // Trois symboles identiques (hors 💎, déjà géré au-dessus)
    if (a === b && b === c) {
        return { gain: mise * 5, label: "🎉 TRIPLE IDENTIQUE !" };
    }
    // Deux symboles identiques quelconques
    if (a === b || b === c || a === c) {
        return { gain: mise * 2, label: "✨ Paire gagnante !" };
    }
    // Rien
    return { gain: 0, label: "Aucune combinaison." };
}

module.exports = {
    command: "!machine",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const args = text.replace("!machine", "").trim().split(" ");
        const pseudo = (args[0] || "").trim();
        const mise = parseInt(args[1]);

        if (!pseudo || isNaN(mise) || mise <= 0) {
            return sock.sendMessage(from, {
                image: { url: IMAGE_URL },
                caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🎰 MACHINE À SOUS*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👉 *!machine <pseudo> <mise>*
🏆 Paire x2 — Triple x5 — Jackpot 💎💎💎 x10
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
            });
        }

        const check = await checkCanPlay(pseudo, mise);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        const rouleau = tirer();
        const { gain, label } = calculerGain(rouleau, mise);

        const user = await applyCasinoResult(check.key, check.user, mise, gain);

        await sock.sendMessage(from, {
            image: { url: IMAGE_URL },
            caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🎰 MACHINE À SOUS*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Jouée par @${senderNumber}_

🎯 Mise : *${mise}🔶*
┃ ${rouleau[0]} ┃ ${rouleau[1]} ┃ ${rouleau[2]} ┃

${label}
${gain > 0 ? `✅ *GAGNÉ !* +${gain}🔶` : `❌ *PERDU.* -${mise}🔶`}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💰 Nouvelle bourse de *${user.pseudo}* : *${user.money}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
