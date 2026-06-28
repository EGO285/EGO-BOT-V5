const { getUser } = require("../utils/users");

const TYPE_EMOJI = {
    achat: "🛍️",
    vente: "💸",
    echange: "🤝",
    casino: "🎰",
    daily: "🎁",
    admin: "🛡️",
};

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

module.exports = {
    command: "!logs",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const pseudo = text.replace("!logs", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, { text: "❌ Exemple : *!logs paul*" });
        }

        const user = await getUser(pseudo.toLowerCase());

        if (!user) {
            return sock.sendMessage(from, { text: `❌ Joueur *${pseudo}* introuvable.` });
        }

        const logs = Array.isArray(user.logs) ? user.logs : [];

        const corps = logs.length
            ? logs.slice(0, 15).map(l => `${TYPE_EMOJI[l.type] || "•"} _${formatDate(l.date)}_ — ${l.detail}`).join("\n")
            : "_Aucune transaction enregistrée pour le moment._";

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*📜 JOURNAL DE ${user.pseudo.toUpperCase()}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
${corps}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Consulté par @${senderNumber}_
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
