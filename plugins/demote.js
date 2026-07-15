// !demote @membre [@membre2 ...] — retire le statut admin d'un ou plusieurs membres.
const { isGroupJid, requirePermission, requireBotIsGroupAdmin } = require("../utils/groupPermissions");

module.exports = {
    command: "!demote",

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

        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (!mentioned.length) {
            return sock.sendMessage(from, { text: "❌ Mentionne au moins un membre à rétrograder.\nExemple : *!demote @membre*" });
        }

        try {
            await sock.groupParticipantsUpdate(from, mentioned, "demote");
        } catch (e) {
            console.error("Erreur !demote:", e);
            return sock.sendMessage(from, { text: "❌ Impossible de rétrograder ce(s) membre(s)." });
        }

        await sock.sendMessage(from, {
            text: `⬇️ ${mentioned.map(j => `@${j.split("@")[0]}`).join(", ")} rétrogradé(s) par @${senderNumber}.`,
            mentions: [senderJid, ...mentioned]
        });
    }
};
