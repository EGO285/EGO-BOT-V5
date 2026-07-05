const { retirerBanque } = require("../utils/users");

function isPV(from) {
    return typeof from === "string" && !from.endsWith("@g.us");
}

module.exports = {
    command: "!retirer",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        if (!isPV(from)) {
            return sock.sendMessage(from, {
                text: "🔒 Pour des raisons de sécurité, *!retirer* doit être utilisé en *message privé* avec le bot, pas dans un groupe."
            });
        }

        const args = text.replace("!retirer", "").trim().split(" ");
        const code = args[0];
        const pseudo = args[1];
        const montant = parseInt(args[2]);

        if (!code || !pseudo || isNaN(montant)) {
            return sock.sendMessage(from, {
                text: "❌ Format : *!retirer <code> <pseudo> <montant>*\nExemple : !retirer 1234 paul 10000"
            });
        }

        const result = await retirerBanque(pseudo, code, montant);

        if (!result.ok) {
            return sock.sendMessage(from, { text: result.error });
        }

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🏦 RETRAIT EFFECTUÉ*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
✅ *${result.montant}🔶* retirés de l'épargne
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💰 Nouvelle bourse : *${result.user.money}🔶*
🏦 Solde épargne restant : *${result.user.banque.solde}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
        });
    }
};
