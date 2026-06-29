const { creerCompteBancaire } = require("../utils/users");

// Détecte si le message provient d'un chat privé (PV) avec le bot,
// et non d'un groupe (@g.us).
function isPV(from) {
    return typeof from === "string" && !from.endsWith("@g.us");
}

module.exports = {
    command: "!creercompte",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        if (!isPV(from)) {
            return sock.sendMessage(from, {
                text: "🔒 Pour des raisons de sécurité, *!creercompte* doit être utilisé en *message privé* avec le bot, pas dans un groupe."
            });
        }

        const args = text.replace("!creercompte", "").trim().split(" ");
        const code = args[0];
        const pseudo = args[1];

        if (!code || !pseudo) {
            return sock.sendMessage(from, {
                text: "❌ Format : *!creercompte <code à 4 chiffres> <pseudo>*\nExemple : !creercompte 1234 paul"
            });
        }

        const result = await creerCompteBancaire(pseudo, code);

        if (!result.ok) {
            return sock.sendMessage(from, { text: result.error });
        }

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🏦 COMPTE BANCAIRE CRÉÉ*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
✅ Compte bancaire activé pour *${result.user.pseudo}*.
🔐 Ton code à 4 chiffres a bien été enregistré.

⚠️ Ne partage *jamais* ton code avec qui que ce soit, même un admin ne te le demandera jamais en groupe.
Toutes tes transactions bancaires (!emprunter, !rembourser, !virement, !deposer, !retirer) devront être faites *en PV* avec ce code.
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
        });
    }
};
