const { isGroupJid, getGroupMetadataSafe } = require("../utils/groupPermissions");
module.exports = {
    command: "!tagadmins",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        if (!isGroupJid(from)) {
            return sock.sendMessage(from, { text: "❌ Cette commande ne marche que dans un groupe." });
        }
        const meta = await getGroupMetadataSafe(sock, from);
        if (!meta) return sock.sendMessage(from, { text: "❌ Impossible de lire les infos du groupe." });
        const admins = meta.participants.filter(p => p.admin === "admin" || p.admin === "superadmin").map(p => p.id);
        if (!admins.length) return sock.sendMessage(from, { text: "❌ Aucun admin trouvé." });
        const message = text.replace("!tagadmins", "").trim();
        const lignes = admins.map(j => `🛡️ @${j.split("@")[0]}`).join("\n");
        await sock.sendMessage(from, {
            text: `📣 *APPEL AUX ADMINS*\n${message ? `\n_${message}_\n` : ""}\n${lignes}\n\n_Par @${senderNumber}_`,
            mentions: [...admins, senderJid],
        });
    }
};
