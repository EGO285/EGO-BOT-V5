// !setgroupname <nouveau nom> — change le nom du groupe courant.
const { isGroupJid, requirePermission, requireBotIsGroupAdmin } = require("../utils/groupPermissions");

module.exports = {
    command: "!setgroupname",

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

        const nouveauNom = text.replace("!setgroupname", "").trim();
        if (!nouveauNom) {
            return sock.sendMessage(from, { text: "❌ Format : *!setgroupname <nouveau nom>*" });
        }

        try {
            await sock.groupUpdateSubject(from, nouveauNom);
        } catch (e) {
            console.error("Erreur !setgroupname:", e);
            return sock.sendMessage(from, { text: "❌ Impossible de changer le nom du groupe." });
        }

        await sock.sendMessage(from, {
            text: `✅ Nom du groupe changé en *${nouveauNom}* par @${senderNumber}.`,
            mentions: [senderJid]
        });
    }
};
