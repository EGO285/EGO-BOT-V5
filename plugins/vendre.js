const cartes = require("../cartes.json");
const { checkAndSellCard } = require("../utils/users");

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
    command: "!vendre",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        // Format : !vendre <nom de la carte> <pseudo>
        const args = text.replace("!vendre", "").trim().split(" ");

        if (args.length < 2) {
            return sock.sendMessage(from, {
                text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*💸 VENDRE UNE CARTE*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👉 *!vendre <nom de la carte> <pseudo>*
💡 Exemple : !vendre Naruto Uzumaki paul
_Revente à 50% du prix d'achat en Ryo._
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
            });
        }

        const pseudo = args[args.length - 1];
        const nomCarte = args.slice(0, -1).join(" ");

        const result = findCarte(nomCarte);

        if (!result) {
            return sock.sendMessage(from, {
                text: `❌ Aucune carte trouvée pour *"${nomCarte}"*.`
            });
        }

        if (result.multiple) {
            const noms = result.multiple.slice(0, 10).map(c => `• ${c.nom} (${c.anime})`).join("\n");
            return sock.sendMessage(from, {
                text: `🔎 Plusieurs cartes correspondent à *"${nomCarte}"* :\n\n${noms}\n\n_Précise le nom complet pour vendre la bonne carte._`
            });
        }

        const carte = result;
        const vente = await checkAndSellCard(pseudo, carte);

        if (!vente.ok) {
            return sock.sendMessage(from, { text: vente.error });
        }

        const { user, gain } = vente;

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*✅ VENTE RÉUSSIE*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Vendue par @${senderNumber}_

🎴 Carte : *${carte.nom}*
💰 Gain : *+${gain}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
Nouvelle bourse de *${user.pseudo}* : *${user.money}🔶*
🎟 Cartes restantes : *${user.cards}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
