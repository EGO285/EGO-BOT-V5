const cartes = require("../cartes.json");
const { checkAndBuyCard } = require("../utils/users");

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
        const achat = await checkAndBuyCard(pseudo, carte);

        if (!achat.ok) {
            return sock.sendMessage(from, { text: achat.error });
        }

        const { user, prixPaye } = achat;
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
💸 Prix payé : *${prixLabel}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
${soldeLabel}
🎟 Cartes possédées : *${user.cards}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
