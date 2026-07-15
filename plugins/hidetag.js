// !hidetag [message] — notifie tous les membres du groupe (ils reçoivent une
// notification) SANS afficher la liste des numéros dans le message, contrairement
// à !tagall.
const { isGroupJid, requirePermission } = require("../utils/groupPermissions");

module.exports = {
    command: "!hidetag",

    async handler(sock, m, text, { senderJid, senderNumber, isAdmin }) {
        const from = m.key.remoteJid;

        if (!isGroupJid(from)) {
            return sock.sendMessage(from, { text: "❌ Cette commande ne fonctionne que dans un groupe." });
        }

        const perm = await requirePermission(sock, from, senderJid, isAdmin);
        if (!perm.ok) {
            return sock.sendMessage(from, { text: perm.error, mentions: [senderJid] });
        }

        const message = text.replace("!hidetag", "").trim() || "📢 Notification pour tout le monde !";
        const participants = perm.metadata.participants.map(p => p.id);

        await sock.sendMessage(from, {
            text: `*_🔔 ${message}_*\n\n_Envoyé par @${senderNumber}_`,
            mentions: [...participants, senderJid]
        });
    }
};
