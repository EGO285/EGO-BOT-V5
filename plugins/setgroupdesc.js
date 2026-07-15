// !setgroupdesc <nouvelle description> — change la description du groupe courant.
const { isGroupJid, requirePermission, requireBotIsGroupAdmin } = require("../utils/groupPermissions");

module.exports = {
    command: "!setgroupdesc",

    async handler(sock, m, text, { senderJid, senderNumber, isAdmin }) {
        const from = m.key.remoteJid;

        if (!isGroupJid(from)) {
            return sock.sendMessage(from, { text: "❌ Cette commande ne fonctionne que dans un groupe." });
        }

        const perm = await requirePermission(sock, from, senderJid, isAdmin);
        if (!perm.ok) {
            return sock.sendMessage(from, { text: perm.error, mentions: [senderJid] });
        }

        const botCheck = await requireBotIsGroupAdmin(sock, from, perm.metadata);
        if (!botCheck.ok) {
            return sock.sendMessage(from, { text: botCheck.error });
        }

        const nouvelleDesc = text.replace("!setgroupdesc", "").trim();
        if (!nouvelleDesc) {
            return sock.sendMessage(from, { text: "❌ Format : *!setgroupdesc <nouvelle description>*" });
        }

        try {
            await sock.groupUpdateDescription(from, nouvelleDesc);
        } catch (e) {
            console.error("Erreur !setgroupdesc:", e);
            return sock.sendMessage(from, { text: "❌ Impossible de changer la description du groupe." });
        }

        await sock.sendMessage(from, {
            text: `✅ Description du groupe mise à jour par @${senderNumber}.`,
            mentions: [senderJid]
        });
    }
};
