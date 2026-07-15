// !promote @membre [@membre2 ...] — promeut un ou plusieurs membres admin du groupe.
const { isGroupJid, requirePermission, requireBotIsGroupAdmin } = require("../utils/groupPermissions");

module.exports = {
    command: "!promote",

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
            return sock.sendMessage(from, { text: "❌ Mentionne au moins un membre à promouvoir admin.\nExemple : *!promote @membre*" });
        }

        try {
            await sock.groupParticipantsUpdate(from, mentioned, "promote");
        } catch (e) {
            console.error("Erreur !promote:", e);
            return sock.sendMessage(from, { text: "❌ Impossible de promouvoir ce(s) membre(s)." });
        }

        await sock.sendMessage(from, {
            text: `⬆️ ${mentioned.map(j => `@${j.split("@")[0]}`).join(", ")} promu(s) admin par @${senderNumber}.`,
            mentions: [senderJid, ...mentioned]
        });
    }
};
