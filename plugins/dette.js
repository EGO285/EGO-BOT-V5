const { getDette } = require("../utils/users");

module.exports = {
    command: "!dette",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const pseudo = text.replace("!dette", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, { text: "❌ Format : *!dette <pseudo>*\nExemple : !dette paul" });
        }

        const result = await getDette(pseudo);

        if (!result.ok) {
            return sock.sendMessage(from, { text: result.error });
        }

        if (result.dette <= 0) {
            return sock.sendMessage(from, {
                text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🏦 DETTE — ${result.user.pseudo}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
✅ Aucune dette en cours. Tout est réglé !
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
            });
        }

        const dateLimite = new Date(result.dateLimite);
        const dateAffichee = dateLimite.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
        const statut = result.enRetard ? "🔴 *EN RETARD*" : "🟢 Dans les délais";

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🏦 DETTE — ${result.user.pseudo}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💳 Montant dû : *${result.dette}🔶*
⏳ Échéance : *${dateAffichee}*
📌 Statut : ${statut}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Rembourse avec !rembourser <code> <montant> (en PV)._
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
        });
    }
};
