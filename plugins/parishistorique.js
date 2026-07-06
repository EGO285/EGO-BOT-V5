const { getHistorique } = require("../utils/parisLibres");

module.exports = {
    command: "!parishistorique",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const filtre = text.replace("!parishistorique", "").trim().toLowerCase();

        let historique = await getHistorique(100);

        if (filtre) {
            historique = historique.filter(h =>
                h.p1.toLowerCase() === filtre ||
                h.p2.toLowerCase() === filtre ||
                h.bets.some(b => b.pseudo.toLowerCase() === filtre)
            );
        }

        historique = historique.slice(0, 10); // les 10 plus récents

        if (!historique.length) {
            return sock.sendMessage(from, {
                text: `ℹ️ Aucun historique de paris${filtre ? ` pour *${filtre}*` : ""} trouvé.`
            });
        }

        const lignes = historique.map(h => {
            const dateTxt = new Date(h.closedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
            let detailParieur = "";

            if (filtre) {
                const bet = h.bets.find(b => b.pseudo.toLowerCase() === filtre);
                if (bet) {
                    detailParieur = bet.gagne
                        ? `\n✅ Ton pari : ${bet.montant}🔶 sur ${bet.cible} → +${bet.gain}🔶`
                        : `\n❌ Ton pari : ${bet.montant}🔶 sur ${bet.cible} (perdu)`;
                }
            }

            return `*#${h.id}* — ${dateTxt}\n⚔️ ${h.p1} vs ${h.p2} — 🏆 *${h.gagnant}*${detailParieur}`;
        }).join("\n\n");

        await sock.sendMessage(from, {
            text: `📜 *HISTORIQUE DES PARIS*${filtre ? ` — ${filtre}` : ""}\n\n${lignes}`
        });
    }
};
