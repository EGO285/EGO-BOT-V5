const cartes = require("../cartes.json");
const { evaluerAchatCarte, finaliserAchatCarte } = require("../utils/users");
const { setPending } = require("../utils/achatsEnAttente");

// Recherche tolérante, identique à celle de !carte : insensible à la casse,
// correspondance exacte en priorité, sinon partielle si non ambiguë.
function findCarte(query) {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const exact = cartes.find(c => c.nom.toLowerCase() === q);
    if (exact) return exact;

    const partial = cartes.filter(c => c.nom.toLowerCase().includes(q));
    if (partial.length === 1) return partial[0];
    if (partial.length > 1) return { multiple: partial };

    return null;
}

module.exports = {
    command: "!acheter",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        // Format : !acheter <nom de la carte> <pseudo>
        // Le pseudo est toujours le dernier mot, le nom de la carte est tout ce qui précède.
        const args = text.replace("!acheter", "").trim().split(" ");

        if (args.length < 2) {
            return sock.sendMessage(from, {
                text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🛍️ ACHETER UNE CARTE*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👉 *!acheter <nom de la carte> <pseudo>*
💡 Exemple : !acheter Naruto Uzumaki paul
_Tape !boutique pour voir les prix._
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
            });
        }

        const pseudo = args[args.length - 1];
        const nomCarte = args.slice(0, -1).join(" ");

        const result = findCarte(nomCarte);

        if (!result) {
            return sock.sendMessage(from, {
                text: `❌ Aucune carte trouvée pour *"${nomCarte}"*.\n\n_Tape !boutique pour voir la liste des cartes disponibles._`
            });
        }

        if (result.multiple) {
            const noms = result.multiple.slice(0, 10).map(c => `• ${c.nom} (${c.anime})`).join("\n");
            return sock.sendMessage(from, {
                text: `🔎 Plusieurs cartes correspondent à *"${nomCarte}"* :\n\n${noms}\n\n_Précise le nom complet pour acheter la bonne carte._`
            });
        }

        const carte = result;
        const evaluation = await evaluerAchatCarte(pseudo, carte);

        if (!evaluation.ok) {
            return sock.sendMessage(from, { text: evaluation.error });
        }

        const { key, user, choix, requiertTicketPourPayer } = evaluation;
        const prixLabel = choix.devise === "money" ? `${choix.montant}🔶` : `${choix.montant}⭐`;
        const prixReduitLabel = choix.devise === "money"
            ? `${Math.round(choix.montant * 0.7)}🔶`
            : `${Math.round(choix.montant * 0.7)}⭐`;

        // Le joueur a des tickets de réduction : on lui demande avant de valider.
        // (Si le plein tarif n'est pas payable, un ticket est OBLIGATOIRE pour continuer.)
        if ((user.ticketsReduction || 0) > 0) {
            setPending(from, pseudo, { carte, choix });

            return sock.sendMessage(from, {
                text:
`🎟️ *${user.pseudo}* possède *${user.ticketsReduction}* ticket(s) de réduction (-30%).

🎴 Carte : *${carte.nom}*
💸 Prix normal : *${prixLabel}*
🎟️ Prix avec ticket : *${prixReduitLabel}*
${requiertTicketPourPayer ? "\n⚠️ Fonds insuffisants au prix normal — le ticket est nécessaire pour cet achat." : ""}
👉 Utiliser un ticket ? *!confirmerachat oui ${pseudo}*
👉 Payer plein tarif ? *!confirmerachat non ${pseudo}*
_(sans réponse sous 5 minutes, la demande expire)_`
            });
        }

        if (requiertTicketPourPayer) {
            return sock.sendMessage(from, {
                text: `❌ Fonds insuffisants pour *${carte.nom}* et aucun ticket de réduction disponible.\n💰 Bourse : *${user.money}🔶* — ⭐ Stars : *${user.stars}*\n🎯 Prix demandé : *${prixLabel}*`
            });
        }

        const achat = await finaliserAchatCarte(key, user, carte, choix, false);
        return envoyerConfirmationAchat(sock, from, senderJid, senderNumber, achat);
    }
};

async function envoyerConfirmationAchat(sock, from, senderJid, senderNumber, achat) {
        const { user, carte, prixPaye, ticketUtilise } = achat;
        const prixLabel = prixPaye.devise === "money" ? `${prixPaye.montant}🔶` : `${prixPaye.montant}⭐`;
        const soldeLabel = prixPaye.devise === "money"
            ? `💰 Nouvelle bourse : *${user.money}🔶*`
            : `⭐ Nouvelles stars : *${user.stars}⭐*`;

        await sock.sendMessage(from, {
            image: { url: carte.image },
            caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*✅ ACHAT RÉUSSI*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Acheté par @${senderNumber}_

🎴 Carte : *${carte.nom}*
📺 Anime : *${carte.anime}*
💸 Prix payé : *${prixLabel}*${ticketUtilise ? " _(ticket de réduction -30% utilisé)_" : ""}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
${soldeLabel}
🎟 Tickets de réduction restants : *${user.ticketsReduction || 0}*
🎴 Cartes possédées : *${user.cards}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
}

module.exports.envoyerConfirmationAchat = envoyerConfirmationAchat;
