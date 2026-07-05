const { saveUser, checkCanPlay, pushLog } = require("../utils/users");
const { loadDB, saveDB } = require("../utils/parisLibres");

module.exports = {
    command: "!parier",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const args = text.replace("!parier", "").trim().split(" ");
        const pseudo = (args[0] || "").trim();
        const montant = parseInt(args[1]);
        const cible = (args[2] || "").trim();

        if (!pseudo || isNaN(montant) || montant <= 0 || !cible) {
            return sock.sendMessage(from, {
                text: "❌ Format : *!parier <ton_pseudo> <montant> <pseudo_choisi>*\nExemple : !parier paul 5000 naruto\n\n_Il faut d'abord qu'une session soit ouverte avec !parilibre debut <p1> <p2>._"
            });
        }

        const db = loadDB();
        const session = db.active[from];

        if (!session) {
            return sock.sendMessage(from, {
                text: "❌ Aucune session de paris active dans ce chat. Lance-en une avec *!parilibre debut <pseudo1> <pseudo2>*."
            });
        }

        const cibleLower = cible.toLowerCase();
        const estP1 = cibleLower === session.p1.toLowerCase();
        const estP2 = cibleLower === session.p2.toLowerCase();

        if (!estP1 && !estP2) {
            return sock.sendMessage(from, {
                text: `❌ *${cible}* ne fait pas partie de ce pari (${session.p1} vs ${session.p2}).`
            });
        }

        const key = pseudo.toLowerCase();
        if (session.bets.some(b => b.pseudo.toLowerCase() === key)) {
            return sock.sendMessage(from, { text: `❌ *${pseudo}* a déjà parié sur cette session.` });
        }

        const check = await checkCanPlay(pseudo, montant);
        if (!check.ok) return sock.sendMessage(from, { text: check.error });

        const cote = estP1 ? session.coteP1 : session.coteP2;
        const cibleFinale = estP1 ? session.p1 : session.p2;

        // La mise est débitée immédiatement ; le gain éventuel est crédité
        // uniquement à la clôture (!parilibre off winner: ...).
        check.user.money = (check.user.money || 0) - montant;
        pushLog(check.user, "pari", `Pari libre placé sur ${cibleFinale} : mise ${montant}🔶 à la cote ${cote}`);
        await saveUser(check.key, check.user);

        session.bets.push({ pseudo: check.user.pseudo, cible: cibleFinale, montant, cote });
        saveDB(db);

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🎲 PARI PLACÉ*
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
