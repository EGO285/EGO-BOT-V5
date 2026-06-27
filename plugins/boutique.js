const cartes = require("../cartes.json");

const RARETE_LABELS = {
    C: "⚪ Commun (C)",
    B: "🔵 Rare (B)",
    A: "🟣 Épique (A)",
    S: "🟡 Légendaire (S)"
};

const RARETE_ORDER = ["S", "A", "B", "C"];

const IMAGE_URL = "https://files.catbox.moe/jchbi8.jpg";

module.exports = {
    command: "!boutique",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        // Regroupe les cartes par rareté, du plus rare au plus commun
        const groupes = {};
        for (const c of cartes) {
            if (!groupes[c.rarete]) groupes[c.rarete] = [];
            groupes[c.rarete].push(c);
        }

        let corps = "";
        for (const rarete of RARETE_ORDER) {
            const liste = groupes[rarete];
            if (!liste || !liste.length) continue;

            corps += `\n${RARETE_LABELS[rarete] || rarete}\n`;
            corps += "▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰\n";

            for (const carte of liste) {
                const prix = Array.isArray(carte.prix) && carte.prix.length
                    ? carte.prix.join(" / ")
                    : "—";
                corps += `🎴 *${carte.nom}* _(${carte.anime})_ — 💰 ${prix}🔶\n`;
            }
        }

        const caption =
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🛍️ BOUTIQUE DE CARTES🛒*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
${corps}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Tape *!carte <nom>* pour voir la fiche complète d'une carte._
_Consultée par @${senderNumber}_
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`;

        await sock.sendMessage(from, {
            image: { url: IMAGE_URL },
            caption,
            mentions: [senderJid]
        });
    }
};
