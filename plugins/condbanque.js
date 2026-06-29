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
▱ Un seul prêt actif à la fois

*💰 Rembourser (!rembourser)*
▱ Remboursement libre, partiel ou total
▱ Tant que la dette n'est pas réglée, impossible d'emprunter à nouveau
▱ Aucune pénalité automatique en cas de retard pour l'instant — mais reste correct, un admin garde un œil sur les dettes en retard 👀

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
