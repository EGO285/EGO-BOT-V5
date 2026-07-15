// !fermergroupe — verrouille le groupe : seuls les admins peuvent écrire (mode "annonces").
const { isGroupJid, requirePermission, requireBotIsGroupAdmin } = require("../utils/groupPermissions");

module.exports = {
    command: "!fermergroupe",

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
            await sock.groupSettingUpdate(from, "announcement");
        } catch (e) {
            console.error("Erreur !fermergroupe:", e);
            return sock.sendMessage(from, { text: "❌ Impossible de verrouiller le groupe." });
        }

        await sock.sendMessage(from, {
            text: `🔒 Groupe verrouillé par @${senderNumber} : seuls les admins peuvent maintenant écrire.`,
            mentions: [senderJid]
        });
    }
};
