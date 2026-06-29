const { rembourser } = require("../utils/users");

function isPV(from) {
    return typeof from === "string" && !from.endsWith("@g.us");
}

module.exports = {
    command: "!rembourser",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        if (!isPV(from)) {
            return sock.sendMessage(from, {
                text: "🔒 Pour des raisons de sécurité, *!rembourser* doit être utilisé en *message privé* avec le bot, pas dans un groupe."
            });
        }

        const args = text.replace("!rembourser", "").trim().split(" ");
        const code = args[0];
        const pseudo = args[1];
        const montant = parseInt(args[2]);

        if (!code || !pseudo || isNaN(montant)) {
            return sock.sendMessage(from, {
                text: "❌ Format : *!rembourser <code> <pseudo> <montant>*\nExemple : !rembourser 1234 paul 5000"
            });
        }

        const result = await rembourser(pseudo, code, montant);

        if (!result.ok) {
            return sock.sendMessage(from, { text: result.error });
        }

        const detteRestanteTxt = result.detteRestante > 0
            ? `⚠️ Dette restante : *${result.detteRestante}🔶*`
            : "🎉 Dette entièrement remboursée !";

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🏦 REMBOURSEMENT EFFECTUÉ*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
✅ Montant remboursé : *${result.montantApplique}🔶*
${detteRestanteTxt}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💰 Nouvelle bourse : *${result.user.money}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
        });
    }
};
