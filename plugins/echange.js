const { checkAndExchangeCard, executeExchange } = require("../utils/users");

// Stockage en mémoire des propositions en attente (clé: pseudoB.toLowerCase())
// Suffisant ici car les échanges sont éphémères et le process reste actif ;
// si le bot redémarre, les propositions en attente sont simplement perdues.
const propositions = new Map();

module.exports = {
    command: "!echange",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        const args = text.replace("!echange", "").trim().split(" ");

        // Sous-commande d'acceptation : !echange accept <pseudoB>
        if (args[0]?.toLowerCase() === "accept") {
            const pseudoB = args[1];
            if (!pseudoB) {
                return sock.sendMessage(from, { text: "❌ Exemple : *!echange accept paul*" });
            }

            const prop = propositions.get(pseudoB.toLowerCase());
            if (!prop) {
                return sock.sendMessage(from, { text: `❌ Aucune proposition d'échange en attente pour *${pseudoB}*.` });
            }

            const check = await checkAndExchangeCard(prop.pseudoA, pseudoB, prop.nomCarte);
            if (!check.ok) {
                propositions.delete(pseudoB.toLowerCase());
                return sock.sendMessage(from, { text: check.error });
            }

            await executeExchange(check.keyA, check.userA, check.keyB, check.userB, check.nomCarte);
            propositions.delete(pseudoB.toLowerCase());

            return sock.sendMessage(from, {
                text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🤝 ÉCHANGE CONFIRMÉ*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
🎴 *${check.nomCarte}*
${check.userA.pseudo} ➡️ ${check.userB.pseudo}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Confirmé par @${senderNumber}_
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
                mentions: [senderJid]
            });
        }

        // Proposition : !echange <pseudoA> <pseudoB> <nom de la carte>
        if (args.length < 3) {
            return sock.sendMessage(from, {
                text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🤝 ÉCHANGE DE CARTE*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👉 *!echange <ton pseudo> <pseudo destinataire> <nom de la carte>*
💡 Exemple : !echange paul julie Naruto Uzumaki

Le destinataire confirme ensuite avec :
👉 *!echange accept <ton pseudo>*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
            });
        }

        const pseudoA = args[0];
        const pseudoB = args[1];
        const nomCarte = args.slice(2).join(" ");

        const check = await checkAndExchangeCard(pseudoA, pseudoB, nomCarte);
        if (!check.ok) {
            return sock.sendMessage(from, { text: check.error });
        }

        propositions.set(pseudoA.toLowerCase(), { pseudoA, pseudoB, nomCarte });

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🤝 PROPOSITION D'ÉCHANGE*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*${check.userA.pseudo}* propose *${nomCarte}* à *${check.userB.pseudo}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_${check.userB.pseudo}, tape *!echange accept ${pseudoA}* pour valider !_
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
