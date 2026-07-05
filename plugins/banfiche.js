const { banFiche } = require("../utils/users");

module.exports = {
    command: "!banfiche",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const args = text.replace("!banfiche", "").trim().split(" ");
        const pseudo = args[0];
        const raison = args.slice(1).join(" ").trim();

        if (!pseudo) {
            return sock.sendMessage(from, {
                text: "❌ Format : *!banfiche <pseudo> [raison]*\nExemple : !banfiche paul comportement toxique"
            });
        }

        const result = await banFiche(pseudo, raison);

        if (!result.ok) {
            return sock.sendMessage(from, { text: result.error });
        }

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*⛔ FICHE BANNIE*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👤 Joueur : *${result.user.pseudo}*
${raison ? `📝 Raison : ${raison}` : ""}
🚫 Ne peut plus jouer à des jeux ni acheter de cartes.
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Utilise !unbanfiche ${result.user.pseudo} pour lever le ban._
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
