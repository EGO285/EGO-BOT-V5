const cartes = require("../cartes.json");

function filterByRarete(rarete) {
    return cartes.filter(c => c.rarete === rarete);
}

module.exports = {
    command: "!tirage",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        let liste;
        let rareteLabel;

        if (text === "!tirage c")      { liste = filterByRarete("C"); rareteLabel = "⚪ Commun (C)"; }
        else if (text === "!tirage b") { liste = filterByRarete("B"); rareteLabel = "🔵 Rare (B)"; }
        else if (text === "!tirage a") { liste = filterByRarete("A"); rareteLabel = "🟣 Épique (A)"; }
        else if (text === "!tirage s") { liste = filterByRarete("S"); rareteLabel = "🟡 Légendaire (S)"; }
        else if (text === "!tirage random") { liste = cartes; rareteLabel = "🎲 Aléatoire"; }
        else {
            return sock.sendMessage(from, {
                text: "❌ Format : *!tirage c/b/a/s/random*\n\n⚪ C — 🔵 B — 🟣 A — 🟡 S — 🎲 random"
            });
        }

        if (!liste || liste.length === 0) {
            return sock.sendMessage(from, { text: "❌ Aucune carte disponible pour cette rareté." });
        }

        const carte = liste[Math.floor(Math.random() * liste.length)];

        await sock.sendMessage(from, {
            image: { url: carte.image },
            caption:
`🎴 *EGO BOT — TIRAGE*
_Par @${senderNumber}_

👤 *Nom* : ${carte.nom}
📺 *Anime* : ${carte.anime}
⭐ *Rareté* : ${rareteLabel}`,
            mentions: [senderJid]
        });
    }
};
