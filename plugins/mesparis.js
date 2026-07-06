const { getAllActiveSessions } = require("../utils/parisLibres");

module.exports = {
    command: "!mesparis",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const pseudo = text.replace("!mesparis", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, {
                text: "❌ Format : *!mesparis <pseudo>*\nExemple : !mesparis paul"
            });
        }

        const toutes = await getAllActiveSessions();
        const cibleLower = pseudo.toLowerCase();

        const mesParis = [];
        for (const s of toutes) {
            const bet = s.bets.find(b => b.pseudo.toLowerCase() === cibleLower);
            if (bet) mesParis.push({ session: s, bet });
        }

        if (!mesParis.length) {
            return sock.sendMessage(from, { text: `ℹ️ *${pseudo}* n'a aucun pari en cours pour le moment.` });
        }

        const lignes = mesParis.map(({ session, bet }) => {
            const gainPotentiel = Math.round(bet.montant * bet.cote);
            return `*#${session.id}* — ⚔️ ${session.p1} 🆚 ${session.p2}\n🎯 Misé sur *${bet.cible}* : *${bet.montant}🔶* à la cote *${bet.cote}*\n💵 Gain potentiel : *${gainPotentiel}🔶*`;
        }).join("\n\n");

        await sock.sendMessage(from, {
            text:
`🎲 *PARIS EN COURS — ${pseudo}*

${lignes}

_Modifie une mise avec !modifierpari ${pseudo} <nouveau_montant> <id>_`
        });
    }
};
