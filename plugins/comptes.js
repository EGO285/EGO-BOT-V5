const { adminListerComptes } = require("../utils/users");

module.exports = {
    command: "!comptes",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        const comptes = await adminListerComptes();

        if (!comptes.length) {
            return sock.sendMessage(from, { text: "🏦 Aucun compte bancaire actif pour le moment." });
        }

        const lignes = comptes.map(c => {
            const echeance = c.dateLimite
                ? new Date(c.dateLimite).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
                : "—";
            return `👤 *${c.pseudo}*\n🏦 Épargne : ${c.solde}🔶 — 💳 Dette : ${c.dette}🔶${c.dette > 0 ? ` (échéance: ${echeance})` : ""}`;
        }).join("\n\n");

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🛡️ COMPTES BANCAIRES (${comptes.length})*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
${lignes}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
ℹ️ _Les codes PIN sont chiffrés (hachés) et ne sont jamais stockés ni affichables en clair, même pour un admin — c'est une protection pour les joueurs._
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
