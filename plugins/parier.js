const { saveUser, checkCanPlay, pushLog } = require("../utils/users");
const { getSessionsForChat, saveSessionsForChat } = require("../utils/parisLibres");

module.exports = {
    command: "!parier",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const args = text.replace("!parier", "").trim().split(" ");
        const pseudo = (args[0] || "").trim();
        const montant = parseInt(args[1]);
        const cible = (args[2] || "").trim();
        const idArg = (args[3] || "").trim();

        if (!pseudo || isNaN(montant) || montant <= 0 || !cible) {
            return sock.sendMessage(from, {
                text: "❌ Format : *!parier <ton_pseudo> <montant> <pseudo_choisi> [id]*\nExemple : !parier paul 5000 naruto\n\n_Il faut d'abord qu'une session soit ouverte avec !parilibre debut <p1> <p2>. Tape !parilibre liste pour voir les sessions en cours._"
            });
        }

        const sessions = await getSessionsForChat(from);
        const cibleLower = cible.toLowerCase();

        let candidats;
        if (idArg) {
            if (!/^\d+$/.test(idArg) || !sessions[idArg]) {
                return sock.sendMessage(from, { text: `❌ Aucune session *#${idArg}* trouvée dans ce chat.` });
            }
            candidats = [idArg];
        } else {
            candidats = Object.keys(sessions).filter(id => {
                const s = sessions[id];
                return cibleLower === s.p1.toLowerCase() || cibleLower === s.p2.toLowerCase();
            });
        }

        if (candidats.length === 0) {
            return sock.sendMessage(from, {
                text: `❌ Aucune session active dans ce chat n'implique *${cible}*. Tape *!parilibre liste* pour voir les sessions en cours.`
            });
        }

        if (candidats.length > 1) {
            const detail = candidats.map(id => `#${id} (${sessions[id].p1} vs ${sessions[id].p2})`).join(", ");
            return sock.sendMessage(from, {
                text: `❌ *${cible}* apparaît dans plusieurs sessions actives : ${detail}.\nPrécise l'ID : *!parier ${pseudo} ${montant} ${cible} <id>*`
            });
        }

        const id = candidats[0];
        const session = sessions[id];
        const estP1 = cibleLower === session.p1.toLowerCase();
        const key = pseudo.toLowerCase();

        if (session.bets.some(b => b.pseudo.toLowerCase() === key)) {
            return sock.sendMessage(from, {
                text: `❌ *${pseudo}* a déjà parié sur la session #${id}. Utilise *!modifierpari ${pseudo} <nouveau_montant> ${id}* pour changer le montant.`
            });
        }

        const check = await checkCanPlay(pseudo, montant);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        const cote = estP1 ? session.coteP1 : session.coteP2;
        const cibleFinale = estP1 ? session.p1 : session.p2;

        // La mise est débitée immédiatement ; le gain éventuel est crédité
        // uniquement à la clôture (!parilibre off winner: ...).
        check.user.money = (check.user.money || 0) - montant;
        pushLog(check.user, "pari", `Pari libre #${id} placé sur ${cibleFinale} : mise ${montant}🔶 à la cote ${cote}`);
        await saveUser(check.key, check.user);

        session.bets.push({ pseudo: check.user.pseudo, cible: cibleFinale, montant, cote });
        await saveSessionsForChat(from, sessions);

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🎲 PARI PLACÉ — #${id}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👤 *${check.user.pseudo}* mise *${montant}🔶* sur *${cibleFinale}*
📈 Cote : *${cote}*
💵 Gain potentiel si victoire : *${Math.round(montant * cote)}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💰 Nouvelle bourse : *${check.user.money}🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
