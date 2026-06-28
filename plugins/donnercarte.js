const cartes = require("../cartes.json");
const { adminGiveCard } = require("../utils/users");

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
    command: "!donnercarte",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        // Format : !donnercarte <nom de la carte> <pseudo>
        const args = text.replace("!donnercarte", "").trim().split(" ");

        if (args.length < 2) {
            return sock.sendMessage(from, {
                text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🛡️ DONNER UNE CARTE (ADMIN)*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👉 *!donnercarte <nom de la carte> <pseudo>*
💡 Exemple : !donnercarte Naruto Uzumaki paul
_Ajoute la carte gratuitement, sans déduire d'argent._
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
            });
        }

        const pseudo = args[args.length - 1];
        const nomCarte = args.slice(0, -1).join(" ");

        const result = findCarte(nomCarte);

        if (!result) {
            return sock.sendMessage(from, { text: `❌ Aucune carte trouvée pour *"${nomCarte}"*.` });
        }

        if (result.multiple) {
            const noms = result.multiple.slice(0, 10).map(c => `• ${c.nom} (${c.anime})`).join("\n");
            return sock.sendMessage(from, {
                text: `🔎 Plusieurs cartes correspondent à *"${nomCarte}"* :\n\n${noms}\n\n_Précise le nom complet._`
            });
        }

        const carte = result;
        const don = await adminGiveCard(pseudo, carte);

        if (!don.ok) {
            return sock.sendMessage(from, { text: don.error });
        }

        const { user } = don;

        await sock.sendMessage(from, {
            image: { url: carte.image },
            caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🛡️ CARTE OFFERTE (ADMIN)*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
🎴 Carte : *${carte.nom}*
👤 Destinataire : *${user.pseudo}*
🎟 Cartes possédées : *${user.cards}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Par @${senderNumber}_
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
