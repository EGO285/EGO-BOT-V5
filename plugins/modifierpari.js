const { getUser, saveUser, pushLog, estFicheBloquee } = require("../utils/users");
const { getSessionsForChat, saveSessionsForChat } = require("../utils/parisLibres");

module.exports = {
    command: "!modifierpari",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const args = text.replace("!modifierpari", "").trim().split(" ");
        const pseudo = (args[0] || "").trim();
        const nouveauMontant = parseInt(args[1]);
        const idArg = (args[2] || "").trim();

        if (!pseudo || isNaN(nouveauMontant) || nouveauMontant <= 0) {
            return sock.sendMessage(from, {
                text: "❌ Format : *!modifierpari <pseudo> <nouveau_montant> [id]*\nExemple : !modifierpari paul 8000"
            });
        }

        const sessions = await getSessionsForChat(from);
        const ids = Object.keys(sessions);

        if (!ids.length) {
            return sock.sendMessage(from, { text: "❌ Aucune session de paris active dans ce chat." });
        }

        let candidats;
        if (idArg) {
            if (!/^\d+$/.test(idArg) || !sessions[idArg]) {
                return sock.sendMessage(from, { text: `❌ Aucune session *#${idArg}* trouvée dans ce chat.` });
            }
            candidats = sessions[idArg].bets.some(b => b.pseudo.toLowerCase() === pseudo.toLowerCase()) ? [idArg] : [];
        } else {
            candidats = ids.filter(id => sessions[id].bets.some(b => b.pseudo.toLowerCase() === pseudo.toLowerCase()));
        }

        if (!candidats.length) {
            return sock.sendMessage(from, {
                text: `❌ Aucun pari actif trouvé pour *${pseudo}*${idArg ? ` dans la session #${idArg}` : " dans ce chat"}.`
            });
        }

        if (candidats.length > 1) {
            return sock.sendMessage(from, {
                text: `❌ *${pseudo}* a des paris actifs dans plusieurs sessions (${candidats.map(i => "#" + i).join(", ")}). Précise l'ID : *!modifierpari ${pseudo} ${nouveauMontant} <id>*`
            });
        }

        const id = candidats[0];
        const session = sessions[id];
        const bet = session.bets.find(b => b.pseudo.toLowerCase() === pseudo.toLowerCase());

        const user = await getUser(pseudo);
        if (!user) {
            return sock.sendMessage(from, { text: `❌ Joueur *${pseudo}* introuvable.` });
        }

        const blocage = estFicheBloquee(user);
        if (blocage.bloque) {
            return sock.sendMessage(from, { text: blocage.error });
        }

        const ancienMontant = bet.montant;
        const diff = nouveauMontant - ancienMontant;

        if (diff === 0) {
            return sock.sendMessage(from, { text: `ℹ️ Le montant est déjà de *${ancienMontant}🔶* sur la session #${id}.` });
        }

        if (diff > 0 && (user.money || 0) < diff) {
            return sock.sendMessage(from, {
                text: `❌ Fonds insuffisants pour augmenter la mise de *${diff}🔶*.\n💰 Bourse actuelle : *${user.money}🔶*`
            });
        }

        user.money = (user.money || 0) - diff; // diff négatif = remboursement partiel
        bet.montant = nouveauMontant;
        // La cote reste figée à celle du premier pari (verrouillée à l'engagement initial)

        pushLog(user, "pari", `Pari #${id} modifié : ${ancienMontant}🔶 → ${nouveauMontant}🔶 sur ${bet.cible}`);
        await saveUser(pseudo.toLowerCase(), user);
        await saveSessionsForChat(from, sessions);

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*✏️ PARI MODIFIÉ — #${id}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👤 *${user.pseudo}* — mise sur *${bet.cible}*
💵 Ancien montant : ${ancienMontant}🔶 → Nouveau : *${nouveauMontant}🔶*
📈 Cote (inchangée) : *${bet.cote}*
🎯 Gain potentiel : *${Math.round(nouveauMontant * bet.cote)}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💰 Nouvelle bourse : *${user.money}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
