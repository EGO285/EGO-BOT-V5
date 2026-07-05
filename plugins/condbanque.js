const { PRET_TAUX_INTERET, PRET_DELAI_MS, PRET_MULTIPLICATEUR_PLAFOND } = require("../utils/users");

const BANQUE_IMAGE_URL = "https://files.catbox.moe/pq45uy.jpg";

module.exports = {
    command: "!condbanque",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        const delaiHeures = Math.round(PRET_DELAI_MS / (60 * 60 * 1000));
        const tauxPct = Math.round(PRET_TAUX_INTERET * 100);

        const caption =
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🏦 CONDITIONS BANCAIRES*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*📝 Créer un compte*
_!creercompte <code> <pseudo>_ (en PV)
Choisis un code à *4 chiffres*. Il te sera demandé pour chaque opération sensible.

*💸 Emprunter (!emprunter)*
▱ Plafond : *${PRET_MULTIPLICATEUR_PLAFOND}x ta bourse actuelle*
▱ Intérêt fixe : *${tauxPct}%* sur le montant emprunté
▱ Délai de remboursement : *${delaiHeures}h*
▱ Un seul prêt actif à la fois, *et un seul prêt par 24h* (même déjà remboursé)

*⚠️ En cas de non-remboursement*
▱ Passé le délai de *${delaiHeures}h* : compte *suspendu 48h* (jeux, achats de cartes et banque bloqués)
▱ Après ces 48h : nouveau délai de *24h* pour rembourser
▱ Cette pénalité peut se répéter *3 fois*
▱ Au 3e non-remboursement : compte *bloqué en permanence*, débloqué uniquement par un admin (*!unlock*)

*💰 Rembourser (!rembourser)*
▱ Remboursement libre, partiel ou total
▱ Tant que la dette n'est pas réglée, impossible d'emprunter à nouveau
▱ Bloqué pendant une suspension : attends la fin de la suspension pour rembourser

*🔁 Virement (!virement)*
▱ Transfert direct entre joueurs, sans frais
▱ Nécessite ton code (en PV)

*🏦 Épargne (!deposer / !retirer)*
▱ Met ton argent à l'abri sur un solde séparé de ta bourse

⚠️ *Toutes ces commandes doivent être tapées en message privé (PV) avec le bot.*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`;

        await sock.sendMessage(from, {
            image: { url: BANQUE_IMAGE_URL },
            caption
        });
    }
};
