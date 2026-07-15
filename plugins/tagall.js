// !tagall [message] — mentionne visiblement tous les membres du groupe, avec
// la liste affichée dans le message (contrairement à !hidetag qui les notifie
// sans afficher la liste).
const { isGroupJid, requirePermission } = require("../utils/groupPermissions");

module.exports = {
    command: "!tagall",

    async handler(sock, m, text, { senderJid, senderNumber, isAdmin }) {
        const from = m.key.remoteJid;

        if (!isGroupJid(from)) {
            return sock.sendMessage(from, { text: "❌ Cette commande ne fonctionne que dans un groupe." });
        }

        const perm = await requirePermission(sock, from, senderJid, isAdmin);
        if (!perm.ok) {
            return sock.sendMessage(from, { text: perm.error, mentions: [senderJid] });
        }

        const message = text.replace("!tagall", "").trim();
        const participants = perm.metadata.participants.map(p => p.id);
        const lignes = participants.map(jid => `📍 @${jid.split("@")[0]}`).join("\n");

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*📢 TAGALL — ${perm.metadata.subject}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
${message ? `_${message}_\n\n` : ""}${lignes}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Envoyé par @${senderNumber}_
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [...participants, senderJid]
        });
    }
};
