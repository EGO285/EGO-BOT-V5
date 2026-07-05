const { debloquerCompte } = require("../utils/users");

module.exports = {
    command: "!unlock",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const pseudo = text.replace("!unlock", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, {
                text: "❌ Format : *!unlock <pseudo>*\nExemple : !unlock paul"
            });
        }

        const result = await debloquerCompte(pseudo);

        if (!result.ok) {
            return sock.sendMessage(from, { text: result.error });
        }

        const detteTxt = result.detteRestante > 0
            ? `⚠️ Il reste une dette de *${result.detteRestante}🔶* à rembourser sous 24h (nouveau délai accordé).`
            : "✅ Aucune dette en cours.";

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🔓 COMPTE DÉBLOQUÉ*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
✅ Le compte bancaire de *${result.user.pseudo}* a été débloqué.
${detteTxt}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
