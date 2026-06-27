const cartes = require("../cartes.json");

const RARETE_LABELS = {
    C: "⚪ Commun (C)",
    B: "🔵 Rare (B)",
    A: "🟣 Épique (A)",
    S: "🟡 Légendaire (S)"
};

// Recherche tolérante : insensible à la casse, et accepte une correspondance partielle
// si aucune correspondance exacte n'est trouvée.
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
    command: "!carte",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        const query = text.replace("!carte", "").trim();

        if (!query) {
            return sock.sendMessage(from, {
                text: "❌ Exemple : *!carte Naruto Uzumaki*"
            });
        }

        const result = findCarte(query);

        if (!result) {
            return sock.sendMessage(from, {
                text: `❌ Aucune carte trouvée pour *"${query}"*.\n\n_Vérifie l'orthographe ou tape !menu pour voir les commandes disponibles._`
            });
        }

        // Plusieurs cartes correspondent : on demande de préciser plutôt que de deviner
        if (result.multiple) {
            const noms = result.multiple.slice(0, 10).map(c => `• ${c.nom} (${c.anime})`).join("\n");
            return sock.sendMessage(from, {
                text: `🔎 Plusieurs cartes correspondent à *"${query}"* :\n\n${noms}\n\n_Précise le nom complet pour voir la fiche exacte._`
            });
        }

        const carte = result;
        const rareteLabel = RARETE_LABELS[carte.rarete] || carte.rarete;

        await sock.sendMessage(from, {
            image: { url: carte.image },
            caption:
`🎴 *FICHE CARTE*
_Consultée par @${senderNumber}_

👤 *Nom* : ${carte.nom}
📺 *Anime* : ${carte.anime}
⭐ *Rareté* : ${rareteLabel}`,
            mentions: [senderJid]
        });
    }
};
