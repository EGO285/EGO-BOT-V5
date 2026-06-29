const { virement } = require("../utils/users");

function isPV(from) {
    return typeof from === "string" && !from.endsWith("@g.us");
}

module.exports = {
    command: "!virement",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        if (!isPV(from)) {
            return sock.sendMessage(from, {
                text: "🔒 Pour des raisons de sécurité, *!virement* doit être utilisé en *message privé* avec le bot, pas dans un groupe."
            });
        }

        const args = text.replace("!virement", "").trim().split(" ");
        const code = args[0];
        const pseudoExpediteur = args[1];
        const pseudoDestinataire = args[2];
        const montant = parseInt(args[3]);

        if (!code || !pseudoExpediteur || !pseudoDestinataire || isNaN(montant)) {
            return sock.sendMessage(from, {
                text: "❌ Format : *!virement <code> <ton pseudo> <pseudo destinataire> <montant>*\nExemple : !virement 1234 paul marie 5000"
            });
        }

        const result = await virement(pseudoExpediteur, code, pseudoDestinataire, montant);

        if (!result.ok) {
            return sock.sendMessage(from, { text: result.error });
        }

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🏦 VIREMENT EFFECTUÉ*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
✅ *${result.montant}🔶* envoyés à *${result.userB.pseudo}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💰 Ta nouvelle bourse : *${result.userA.money}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
        });
    }
};
