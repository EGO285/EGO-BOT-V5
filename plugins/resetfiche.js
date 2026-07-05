const { resetFiche } = require("../utils/users");

module.exports = {
    command: "!resetfiche",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const pseudo = text.replace("!resetfiche", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, {
                text: "❌ Format : *!resetfiche <pseudo>*\nExemple : !resetfiche paul\n⚠️ Remet l'argent, les stats, l'inventaire et la banque à zéro (le pseudo est conservé)."
            });
        }

        const result = await resetFiche(pseudo);

        if (!result.ok) {
            return sock.sendMessage(from, { text: result.error });
        }

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*♻️ FICHE RÉINITIALISÉE*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👤 *${result.user.pseudo}* est reparti de zéro :
💰 Bourse : *0🔶* — ⭐ Stars : *0*
🎴 Inventaire vidé — 🏆 Stats remises à zéro
${result.user.banque?.compteActif ? "🏦 Compte bancaire conservé (épargne, dette et suspensions remises à zéro)." : ""}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
