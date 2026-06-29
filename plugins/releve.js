const { getReleve } = require("../utils/users");

const LABELS = {
    achat: "🛍️ Achat",
    vente: "💸 Vente",
    echange: "🔄 Échange",
    daily: "🎁 Daily",
    admin: "🛡️ Admin",
    banque: "🏦 Banque",
};

module.exports = {
    command: "!releve",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const pseudo = text.replace("!releve", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, { text: "❌ Format : *!releve <pseudo>*\nExemple : !releve paul" });
        }

        const result = await getReleve(pseudo);

        if (!result.ok) {
            return sock.sendMessage(from, { text: result.error });
        }

        const lignes = result.logs.length
            ? result.logs.map(l => {
                const d = new Date(l.date);
                const dateAffichee = d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
                return `🏦 _${dateAffichee}_\n${l.detail}`;
            }).join("\n\n")
            : "_Aucune opération bancaire pour le moment._";

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🏦 RELEVÉ BANCAIRE — ${result.user.pseudo}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
${lignes}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
        });
    }
};
