const { getUser, saveUser, pushLog } = require("../utils/users");
const {
    getSessionsForChat,
    saveSessionsForChat,
    nextSessionId,
    calculerCotes,
    archiverSession,
} = require("../utils/parisLibres");

module.exports = {
    command: "!parilibre",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const args = text.replace("!parilibre", "").trim().split(" ");
        const sousCommande = (args[0] || "").toLowerCase();

        const sessions = await getSessionsForChat(from);

        // =========================
        // 🟢 OUVRIR UNE NOUVELLE SESSION (plusieurs peuvent tourner en même temps)
        // =========================
        if (sousCommande === "debut") {
            const p1 = (args[1] || "").toLowerCase().trim();
            const p2 = (args[2] || "").toLowerCase().trim();

            if (!p1 || !p2 || p1 === p2) {
                return sock.sendMessage(from, {
                    text: "❌ Format : *!parilibre debut <pseudo1> <pseudo2>*\nExemple : !parilibre debut naruto sasuke"
                });
            }

            const [userP1, userP2] = await Promise.all([getUser(p1), getUser(p2)]);

            if (!userP1 || !userP2) {
                return sock.sendMessage(from, {
                    text: `❌ Joueur introuvable : *${!userP1 ? p1 : p2}*. Vérifie les pseudos (fiches créées avec !new).`
                });
            }

            const { coteA, coteB } = calculerCotes(userP1.points || 0, userP2.points || 0);
            const id = await nextSessionId();

            sessions[id] = {
                p1: userP1.pseudo,
                p2: userP2.pseudo,
                pointsP1: userP1.points || 0,
                pointsP2: userP2.points || 0,
                coteP1: coteA,
                coteP2: coteB,
                openedBy: senderNumber,
                openedAt: new Date().toISOString(),
                bets: []
            };
            await saveSessionsForChat(from, sessions);

            return sock.sendMessage(from, {
                text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🎲 PARIS OUVERTS — #${id}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
⚔️ *${userP1.pseudo}* (${userP1.points || 0}pts) — cote *${coteA}*
🆚
⚔️ *${userP2.pseudo}* (${userP2.points || 0}pts) — cote *${coteB}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👉 Parie avec *!parier <ton_pseudo> <montant> <pseudo_choisi>*
${Object.keys(sessions).length > 1 ? `_(plusieurs sessions actives ici — précise l'ID si besoin : !parier ... ${id})_\n` : ""}📢 Ouvert par @${senderNumber}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
                mentions: [senderJid]
            });
        }

        // =========================
        // 📋 LISTER LES SESSIONS ACTIVES DE CE CHAT
        // =========================
        if (sousCommande === "liste") {
            const ids = Object.keys(sessions);
            if (!ids.length) {
                return sock.sendMessage(from, { text: "ℹ️ Aucune session de paris active dans ce chat." });
            }

            const lignes = ids.map(id => {
                const s = sessions[id];
                return `*#${id}* — ⚔️ ${s.p1} (cote ${s.coteP1}) 🆚 ${s.p2} (cote ${s.coteP2})\n💬 ${s.bets.length} pari(s) placé(s)`;
            }).join("\n\n");

            return sock.sendMessage(from, {
                text:
`🎲 *SESSIONS DE PARIS ACTIVES*\n\n${lignes}\n\n_Parie avec !parier <pseudo> <montant> <cible> <id>_\n_Clôture avec !parilibre off <id> winner: <pseudo>_`
            });
        }

        // =========================
        // 🔴 CLÔTURER ET RÉGLER UNE SESSION
        // Réservé à la personne qui a ouvert la session (pas un rôle admin),
        // pour éviter qu'un tiers ne déclare un faux vainqueur sur un pari
        // qui ne lui appartient pas.
        // =========================
        if (sousCommande === "off") {
            const ids = Object.keys(sessions);

            if (!ids.length) {
                return sock.sendMessage(from, { text: "❌ Aucune session de paris active dans ce chat." });
            }

            let id = (args[1] && /^\d+$/.test(args[1])) ? args[1] : null;

            if (!id) {
                if (ids.length > 1) {
                    return sock.sendMessage(from, {
                        text: `❌ Plusieurs sessions sont actives ici (${ids.map(i => "#" + i).join(", ")}). Précise l'ID : *!parilibre off <id> winner: <pseudo>*`
                    });
                }
                id = ids[0];
            }

            const session = sessions[id];
            if (!session) {
                return sock.sendMessage(from, { text: `❌ Aucune session *#${id}* trouvée dans ce chat.` });
            }

            if (session.openedBy !== senderNumber) {
                return sock.sendMessage(from, {
                    text: `⛔ Seul le joueur qui a ouvert la session *#${id}* (@${session.openedBy}) peut la clôturer.`,
                    mentions: [`${session.openedBy}@s.whatsapp.net`]
                });
            }

            const winnerRaw = text.split("winner:")[1]?.trim().toLowerCase();
            if (!winnerRaw) {
                return sock.sendMessage(from, { text: `❌ Format : *!parilibre off ${id} winner: <pseudo>*` });
            }

            const gagnant = [session.p1, session.p2].find(p => p.toLowerCase() === winnerRaw);
            if (!gagnant) {
                return sock.sendMessage(from, {
                    text: `❌ *${winnerRaw}* ne fait pas partie de ce pari #${id} (${session.p1} vs ${session.p2}).`
                });
            }

            let recap = "";
            const betsArchive = [];

            for (const bet of session.bets) {
                const bettorKey = bet.pseudo.toLowerCase();
                const bettorUser = await getUser(bettorKey);

                const gagne = bet.cible.toLowerCase() === gagnant.toLowerCase();
                const gain = gagne ? Math.round(bet.montant * bet.cote) : 0;

                if (bettorUser) {
                    if (gagne) {
                        bettorUser.money = (bettorUser.money || 0) + gain;
                        pushLog(bettorUser, "pari", `Pari libre #${id} gagné sur ${gagnant} : mise ${bet.montant}🔶 à la cote ${bet.cote} → +${gain}🔶`);
                    } else {
                        pushLog(bettorUser, "pari", `Pari libre #${id} perdu sur ${bet.cible} : mise ${bet.montant}🔶 perdue`);
                    }
                    await saveUser(bettorKey, bettorUser);
                    recap += gagne
                        ? `✅ *${bettorUser.pseudo}* : +${gain}🔶 (mise ${bet.montant}🔶 × cote ${bet.cote})\n`
                        : `❌ *${bettorUser.pseudo}* : -${bet.montant}🔶 (perdu)\n`;
                }

                betsArchive.push({ pseudo: bet.pseudo, cible: bet.cible, montant: bet.montant, cote: bet.cote, gagne, gain });
            }

            await archiverSession({
                id,
                chatJid: from,
                p1: session.p1,
                p2: session.p2,
                pointsP1: session.pointsP1,
                pointsP2: session.pointsP2,
                coteP1: session.coteP1,
                coteP2: session.coteP2,
                gagnant,
                openedBy: session.openedBy,
                openedAt: session.openedAt,
                closedBy: senderNumber,
                closedAt: new Date().toISOString(),
                bets: betsArchive,
            });

            delete sessions[id];
            await saveSessionsForChat(from, sessions);

            return sock.sendMessage(from, {
                text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🏁 PARIS RÉGLÉS — #${id}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
🏆 Vainqueur : *${gagnant}*

${recap || "_Aucun pari n'avait été placé sur cette session._"}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Clôturé par @${senderNumber}_
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
                mentions: [senderJid]
            });
        }

        // =========================
        // ℹ️ AIDE PAR DÉFAUT
        // =========================
        return sock.sendMessage(from, {
            text:
`🎲 *PARI LIBRE (1v1)*

👉 *!parilibre debut <pseudo1> <pseudo2>* — Ouvrir une session (plusieurs peuvent tourner en même temps)
👉 *!parilibre liste* — Voir les sessions actives dans ce chat
👉 *!parier <ton_pseudo> <montant> <pseudo_choisi> [id]* — Parier
👉 *!modifierpari <ton_pseudo> <nouveau_montant> [id]* — Changer le montant d'un pari déjà placé
👉 *!mesparis <ton_pseudo>* — Voir tous tes paris en cours (tous chats confondus)
👉 *!parishistorique [pseudo]* — Voir l'historique des paris clôturés
👉 *!parilibre off [id] winner: <pseudo>* — Clôturer et régler (réservé à celui qui a ouvert la session)

_Les cotes sont calculées automatiquement à partir du classement (points) des deux joueurs : plus l'écart est grand, plus la cote de l'outsider est élevée._`
        });
    }
};
