const { unbanFiche } = require("../utils/users");

module.exports = {
    command: "!unbanfiche",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const pseudo = text.replace("!unbanfiche", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, {
                text: "❌ Format : *!unbanfiche <pseudo>*\nExemple : !unbanfiche paul"
            });
        }

        const result = await unbanFiche(pseudo);

        if (!result.ok) {
            return sock.sendMessage(from, { text: result.error });
        }

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*✅ FICHE DÉBANNIE*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👤 *${result.user.pseudo}* peut de nouveau jouer et acheter des cartes.
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
