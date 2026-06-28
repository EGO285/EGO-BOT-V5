const { getUser, saveUser, pushLog } = require("../utils/users");

const PRIX_TICKET = 5000;
const IMAGE_URL = "https://files.catbox.moe/04bcjy.jpg";

// État du tirage en cours, en mémoire (suffisant pour une loterie communautaire
// éphémère ; si le bot redémarre, le tirage en cours est perdu et il faut relancer).
let ticketsAchetes = []; // [{ pseudo, key }]

module.exports = {
    command: "!loto",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const args = text.replace("!loto", "").trim().split(" ");
        const sousCommande = (args[0] || "").toLowerCase();

        // !loto -> affiche l'état actuel du tirage
        if (!sousCommande) {
            return sock.sendMessage(from, {
                image: { url: IMAGE_URL },
                caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🎟️ LOTERIE EGO BOT*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
🎟 Prix du ticket : *${PRIX_TICKET}🔶*
👥 Participants actuels : *${ticketsAchetes.length}*
🏆 Cagnotte actuelle : *${ticketsAchetes.length * PRIX_TICKET}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👉 *!loto acheter <pseudo>* — acheter un ticket
👉 *!loto tirer* (admin) — lance le tirage et désigne un gagnant
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
            });
        }

        // !loto acheter <pseudo>
        if (sousCommande === "acheter") {
            const pseudo = args[1];
            if (!pseudo) {
                return sock.sendMessage(from, { text: "❌ Exemple : *!loto acheter paul*" });
            }

            const key = pseudo.toLowerCase();
            const user = await getUser(key);

            if (!user) {
                return sock.sendMessage(from, { text: `❌ Joueur *${pseudo}* introuvable.` });
            }

            if ((user.money || 0) < PRIX_TICKET) {
                return sock.sendMessage(from, {
                    text: `❌ Fonds insuffisants.\n💰 Bourse : *${user.money}🔶*\n🎟 Prix du ticket : *${PRIX_TICKET}🔶*`
                });
            }

            user.money -= PRIX_TICKET;
            pushLog(user, "casino", `Ticket de loterie acheté (${PRIX_TICKET}🔶)`);
            await saveUser(key, user);

            ticketsAchetes.push({ pseudo: user.pseudo, key });

            return sock.sendMessage(from, {
                text:
`🎟️ *${user.pseudo}* a acheté un ticket !
👥 Participants : *${ticketsAchetes.length}*
🏆 Cagnotte : *${ticketsAchetes.length * PRIX_TICKET}🔶*
💰 Bourse restante : *${user.money}🔶*`,
                mentions: [senderJid]
            });
        }

        // !loto tirer (admin) -> tire un gagnant au hasard parmi les tickets
        if (sousCommande === "tirer") {
            if (ticketsAchetes.length === 0) {
                return sock.sendMessage(from, { text: "❌ Aucun ticket vendu pour l'instant, impossible de tirer." });
            }

            const cagnotte = ticketsAchetes.length * PRIX_TICKET;
            const gagnantIndex = Math.floor(Math.random() * ticketsAchetes.length);
            const gagnant = ticketsAchetes[gagnantIndex];

            const user = await getUser(gagnant.key);
            user.money = (user.money || 0) + cagnotte;
            pushLog(user, "casino", `Gagnant de la loterie : +${cagnotte}🔶`);
            await saveUser(gagnant.key, user);

            const nbParticipants = ticketsAchetes.length;
            ticketsAchetes = []; // reset pour le prochain tirage

            return sock.sendMessage(from, {
                image: { url: IMAGE_URL },
                caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🎉 TIRAGE DE LA LOTERIE*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👥 Participants : *${nbParticipants}*
🏆 Cagnotte : *${cagnotte}🔶*

🥇 Gagnant : *${user.pseudo}* !
💰 Nouvelle bourse : *${user.money}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Tiré par @${senderNumber}_
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
                mentions: [senderJid]
            });
        }

        return sock.sendMessage(from, { text: "❌ Sous-commande inconnue. Tape *!loto* pour voir l'aide." });
    }
};
