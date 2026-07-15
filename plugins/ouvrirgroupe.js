// !ouvrirgroupe — déverrouille le groupe : tous les membres peuvent de nouveau écrire.
const { isGroupJid, requirePermission, requireBotIsGroupAdmin } = require("../utils/groupPermissions");

module.exports = {
    command: "!ouvrirgroupe",

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

        try {
            await sock.groupSettingUpdate(from, "not_announcement");
        } catch (e) {
            console.error("Erreur !ouvrirgroupe:", e);
            return sock.sendMessage(from, { text: "❌ Impossible de déverrouiller le groupe." });
        }

        await sock.sendMessage(from, {
            text: `🔓 Groupe déverrouillé par @${senderNumber} : tous les membres peuvent de nouveau écrire.`,
            mentions: [senderJid]
        });
    }
};
