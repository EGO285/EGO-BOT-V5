// !kick @membre [@membre2 ...] — exclut un ou plusieurs membres mentionnés du groupe.
const { isGroupJid, requirePermission, requireBotIsGroupAdmin } = require("../utils/groupPermissions");

module.exports = {
    command: "!kick",

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
            return sock.sendMessage(from, { text: "❌ Mentionne au moins un membre à exclure.\nExemple : *!kick @membre*" });
        }

        try {
            await sock.groupParticipantsUpdate(from, mentioned, "remove");
        } catch (e) {
            console.error("Erreur !kick:", e);
            return sock.sendMessage(from, { text: "❌ Impossible d'exclure ce(s) membre(s) (droits insuffisants, ou déjà parti(s))." });
        }

        await sock.sendMessage(from, {
            text: `✅ ${mentioned.length > 1 ? "Membres exclus" : "Membre exclu"} par @${senderNumber} : ${mentioned.map(j => `@${j.split("@")[0]}`).join(", ")}`,
            mentions: [senderJid, ...mentioned]
        });
    }
};
