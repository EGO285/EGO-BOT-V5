const { deposerBanque } = require("../utils/users");

function isPV(from) {
    return typeof from === "string" && !from.endsWith("@g.us");
}

module.exports = {
    command: "!deposer",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        if (!isPV(from)) {
            return sock.sendMessage(from, {
                text: "🔒 Pour des raisons de sécurité, *!deposer* doit être utilisé en *message privé* avec le bot, pas dans un groupe."
            });
        }

        const args = text.replace("!deposer", "").trim().split(" ");
        const code = args[0];
        const pseudo = args[1];
        const montant = parseInt(args[2]);

        if (!code || !pseudo || isNaN(montant)) {
            return sock.sendMessage(from, {
                text: "❌ Format : *!deposer <code> <pseudo> <montant>*\nExemple : !deposer 1234 paul 10000"
            });
        }

        const result = await deposerBanque(pseudo, code, montant);

        if (!result.ok) {
            return sock.sendMessage(from, { text: result.error });
        }

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🏦 DÉPÔT EFFECTUÉ*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
✅ *${result.montant}🔶* déposés sur l'épargne
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💰 Bourse restante : *${result.user.money}🔶*
🏦 Solde épargne : *${result.user.banque.solde}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
        });
    }
};
