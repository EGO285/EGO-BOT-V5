const { emprunter, PRET_TAUX_INTERET, PRET_DELAI_MS } = require("../utils/users");

function isPV(from) {
    return typeof from === "string" && !from.endsWith("@g.us");
}

module.exports = {
    command: "!emprunter",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        if (!isPV(from)) {
            return sock.sendMessage(from, {
                text: "🔒 Pour des raisons de sécurité, *!emprunter* doit être utilisé en *message privé* avec le bot, pas dans un groupe."
            });
        }

        const args = text.replace("!emprunter", "").trim().split(" ");
        const code = args[0];
        const pseudo = args[1];
        const montant = parseInt(args[2]);

        if (!code || !pseudo || isNaN(montant)) {
            return sock.sendMessage(from, {
                text: "❌ Format : *!emprunter <code> <pseudo> <montant>*\nExemple : !emprunter 1234 paul 20000\n\n💡 Tape *!condbanque* pour connaître les conditions d'emprunt."
            });
        }

        const result = await emprunter(pseudo, code, montant);

        if (!result.ok) {
            return sock.sendMessage(from, { text: result.error });
        }

        const dateLimite = new Date(result.dateLimite);
        const dateAffichee = dateLimite.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🏦 EMPRUNT ACCORDÉ*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
✅ Montant emprunté : *${result.montant}🔶*
📈 Intérêt (${Math.round(PRET_TAUX_INTERET * 100)}%) : *+${result.interet}🔶*
💳 Dette totale à rembourser : *${result.detteTotale}🔶*
⏳ Échéance : *${dateAffichee}* (48h)
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💰 Nouvelle bourse : *${result.user.money}🔶*
_Utilise !rembourser <code> <montant> pour remettre la dette à 0._
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
        });
    }
};
