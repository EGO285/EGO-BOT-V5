const { getUser, saveUser, pushLog } = require("../utils/users");
const { loadDB, saveDB, calculerCotes } = require("../utils/parisLibres");

module.exports = {
    command: "!parilibre",

    async handler(sock, m, text, { senderJid, senderNumber, isAdmin }) {
        const from = m.key.remoteJid;
        const args = text.replace("!parilibre", "").trim().split(" ");
        const sousCommande = (args[0] || "").toLowerCase();

        const db = loadDB();

        // =========================
        // 🟢 OUVRIR UNE SESSION DE PARIS
        // =========================
        if (sousCommande === "debut") {
            if (db.active[from]) {
                return sock.sendMessage(from, {
                    text: `❌ Une session de paris est déjà active dans ce chat (*${db.active[from].p1}* vs *${db.active[from].p2}*). Clôture-la avec *!parilibre off winner: <pseudo>* avant d'en ouvrir une nouvelle.`
                });
            }

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

            db.active[from] = {
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
            saveDB(db);

            return sock.sendMessage(from, {
                text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🎲 PARIS OUVERTS !*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
⚔️ *${userP1.pseudo}* (${userP1.points || 0}pts) — cote *${coteA}*
🆚
⚔️ *${userP2.pseudo}* (${userP2.points || 0}pts) — cote *${coteB}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👉 Parie avec *!parier <ton_pseudo> <montant> <pseudo_choisi>*
📢 Ouvert par @${senderNumber}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
                mentions: [senderJid]
            });
        }

        // =========================
        // 🔴 CLÔTURER ET RÉGLER LES PARIS (admin uniquement — de l'argent est distribué)
        // =========================
        if (sousCommande === "off") {
            if (!isAdmin) {
                return sock.sendMessage(from, { text: "⛔ Seul un admin peut clôturer une session de paris et déclarer le vainqueur." });
            }

            const session = db.active[from];
            if (!session) {
                return sock.sendMessage(from, { text: "❌ Aucune session de paris active dans ce chat." });
            }

            const winnerRaw = text.split("winner:")[1]?.trim().toLowerCase();
            if (!winnerRaw) {
                return sock.sendMessage(from, { text: "❌ Format : *!parilibre off winner: <pseudo>*" });
            }

            const gagnant = [session.p1, session.p2].find(p => p.toLowerCase() === winnerRaw);
            if (!gagnant) {
                return sock.sendMessage(from, {
                    text: `❌ *${winnerRaw}* ne fait pas partie de ce pari (${session.p1} vs ${session.p2}).`
                });
            }

            let recap = "";

            for (const bet of session.bets) {
                const bettorKey = bet.pseudo.toLowerCase();
                const bettorUser = await getUser(bettorKey);
                if (!bettorUser) continue; // fiche supprimée entre-temps, on ignore ce pari

                if (bet.cible.toLowerCase() === gagnant.toLowerCase()) {
                    const gain = Math.round(bet.montant * bet.cote);
                    bettorUser.money = (bettorUser.money || 0) + gain;
                    pushLog(bettorUser, "pari", `Pari libre gagné sur ${gagnant} : mise ${bet.montant}🔶 à la cote ${bet.cote} → +${gain}🔶`);
                    await saveUser(bettorKey, bettorUser);
                    recap += `✅ *${bettorUser.pseudo}* : +${gain}🔶 (mise ${bet.montant}🔶 × cote ${bet.cote})\n`;
                } else {
                    pushLog(bettorUser, "pari", `Pari libre perdu sur ${bet.cible} : mise ${bet.montant}🔶 perdue`);
                    recap += `❌ *${bettorUser.pseudo}* : -${bet.montant}🔶 (perdu)\n`;
                }
            }

            delete db.active[from];
            saveDB(db);

            return sock.sendMessage(from, {
                text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🏁 PARIS RÉGLÉS*
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
        // ℹ️ AIDE / ÉTAT ACTUEL
        // =========================
        const session = db.active[from];
        if (session) {
            return sock.sendMessage(from, {
                text:
`🎲 *PARI LIBRE EN COURS*
⚔️ *${session.p1}* — cote *${session.coteP1}*
🆚
⚔️ *${session.p2}* — cote *${session.coteP2}*

👉 Parie avec *!parier <ton_pseudo> <montant> <pseudo_choisi>*
👉 *!parilibre off winner: <pseudo>* pour clôturer (admin)`
            });
        }

        return sock.sendMessage(from, {
            text:
`🎲 *PARI LIBRE (1v1)*

👉 *!parilibre debut <pseudo1> <pseudo2>* — Ouvrir une session de paris
👉 *!parier <ton_pseudo> <montant> <pseudo_choisi>* — Parier
👉 *!parilibre off winner: <pseudo>* — Clôturer et régler (admin)

_Les cotes sont calculées automatiquement à partir du classement (points) des deux joueurs : plus l'écart est grand, plus la cote de l'outsider est élevée._`
        });
    }
};
