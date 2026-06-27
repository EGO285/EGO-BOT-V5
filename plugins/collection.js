const { getUser } = require("../utils/users");

module.exports = {
    command: "!collection",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        const pseudo = text.replace("!collection", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, { text: "❌ Exemple : *!collection paul*" });
        }

        const user = await getUser(pseudo.toLowerCase());

        if (!user) {
            return sock.sendMessage(from, { text: `❌ Joueur *${pseudo}* introuvable.` });
        }

        const inventaire = Array.isArray(user.inventaire) ? user.inventaire : [];

        const corps = inventaire.length
            ? inventaire.map(nom => `🎴 ${nom}`).join("\n")
            : "_Aucune carte achetée pour le moment._\n_Tape !boutique pour voir les cartes disponibles._";

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🃏 COLLECTION DE ${user.pseudo.toUpperCase()}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
🎟 Total : *${inventaire.length} carte${inventaire.length > 1 ? "s" : ""}*
▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰
${corps}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Consultée par @${senderNumber}_
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
