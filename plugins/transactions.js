const { getTransactions } = require("../utils/users");

const LABELS = {
    emprunt: "📥 Emprunt",
    remboursement: "📤 Remboursement",
    virement: "🔁 Virement",
    depot: "🏦 Dépôt épargne",
    retrait: "💸 Retrait épargne",
};

module.exports = {
    command: "!transactions",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        const args = text.replace("!transactions", "").trim();
        const n = parseInt(args) || 20;

        const transactions = await getTransactions(Math.min(n, 50));

        if (!transactions.length) {
            return sock.sendMessage(from, { text: "🏦 Aucune transaction bancaire enregistrée pour le moment." });
        }

        const lignes = transactions.map(t => {
            const date = new Date(t.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
            const label = LABELS[t.type] || t.type;
            return `${label} — *${t.pseudo}*\n${t.detail}\n_${date}_`;
        }).join("\n\n");

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🛡️ TRANSACTIONS BANCAIRES (${transactions.length})*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
${lignes}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
