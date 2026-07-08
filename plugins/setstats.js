const { getUser, saveUser } = require("../utils/users");

module.exports = {
    command: "!setstats",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        // Format : !setstats <pseudo> <argent|stars|ticket> <valeur>
        const args = text.replace("!setstats", "").trim().split(" ");
        const name = args[0]?.toLowerCase();
        const champ = (args[1] || "").toLowerCase();
        const valeur = parseInt(args[2]);

        if (!name || !["argent", "stars", "ticket"].includes(champ) || isNaN(valeur)) {
            return sock.sendMessage(from, {
                text:
`❌ Format : *!setstats <pseudo> <argent|stars|ticket> <valeur>*

💡 Exemples :
!setstats paul argent 50000
!setstats paul stars 10
!setstats paul ticket 3`
            });
        }

        const user = await getUser(name);

        if (!user) {
            return sock.sendMessage(from, { text: `❌ Joueur *${name}* introuvable.` });
        }

        if (champ === "argent") {
            user.money = valeur;
        } else if (champ === "stars") {
            user.stars = valeur;
        } else {
            user.ticketsReduction = Math.max(0, valeur);
        }

        await saveUser(name, user);

        const labels = { argent: "💰 BOURSE", stars: "⭐ STARS", ticket: "🎟️ TICKETS DE RÉDUCTION" };
        const label = labels[champ];
        const nouvelleValeur =
            champ === "argent" ? `${user.money}🔶` :
            champ === "stars" ? `${user.stars}⭐` :
            `${user.ticketsReduction}🎟️`;

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🛡️ MODIFICATION ADMIN*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👤 Joueur : *${user.pseudo}*
${label} fixée à : *${nouvelleValeur}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Par @${senderNumber}_
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
