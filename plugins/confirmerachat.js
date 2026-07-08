const { finaliserAchatCarte, getUser } = require("../utils/users");
const { getPending, clearPending } = require("../utils/achatsEnAttente");
const acheter = require("./acheter");

module.exports = {
    command: "!confirmerachat",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const args = text.replace("!confirmerachat", "").trim().split(" ");
        const reponse = (args[0] || "").toLowerCase();
        const pseudo = (args[1] || "").trim();

        if (!["oui", "non"].includes(reponse) || !pseudo) {
            return sock.sendMessage(from, {
                text: "❌ Format : *!confirmerachat <oui|non> <pseudo>*\nExemple : !confirmerachat oui paul"
            });
        }

        const attente = getPending(from, pseudo);
        if (!attente) {
            return sock.sendMessage(from, {
                text: `❌ Aucun achat en attente de confirmation pour *${pseudo}* (ou la demande a expiré, retape *!acheter*).`
            });
        }

        const utiliserTicket = reponse === "oui";
        const key = pseudo.toLowerCase();
        const user = await getUser(key);

        if (!user) {
            clearPending(from, pseudo);
            return sock.sendMessage(from, { text: `❌ Joueur *${pseudo}* introuvable.` });
        }

        if (utiliserTicket && !(user.ticketsReduction > 0)) {
            clearPending(from, pseudo);
            return sock.sendMessage(from, { text: `❌ *${pseudo}* n'a plus de ticket de réduction disponible.` });
        }

        // Si le plein tarif n'était pas payable, refuser le "non" (le ticket est obligatoire)
        if (!utiliserTicket) {
            const { choix } = attente;
            const peutPayerPleinTarif =
                (choix.devise === "money" && (user.money || 0) >= choix.montant) ||
                (choix.devise === "stars" && (user.stars || 0) >= choix.montant);

            if (!peutPayerPleinTarif) {
                clearPending(from, pseudo);
                return sock.sendMessage(from, {
                    text: `❌ Fonds insuffisants pour payer plein tarif. Utilise *!confirmerachat oui ${pseudo}* pour appliquer le ticket de réduction, ou retape *!acheter*.`
                });
            }
        }

        clearPending(from, pseudo);

        const achat = await finaliserAchatCarte(key, user, attente.carte, attente.choix, utiliserTicket);
        return acheter.envoyerConfirmationAchat(sock, from, senderJid, senderNumber, achat);
    }
};
