// !groupinfo — affiche les informations du groupe courant (nom, description,
// nombre de membres, liste des admins, statut verrouillé/déverrouillé).
const { isGroupJid, getGroupMetadataSafe, participantIsAdmin } = require("../utils/groupPermissions");

module.exports = {
    command: "!groupinfo",

    async handler(sock, m, text, { senderNumber }) {
        const from = m.key.remoteJid;

        if (!isGroupJid(from)) {
            return sock.sendMessage(from, { text: "❌ Cette commande ne fonctionne que dans un groupe." });
        }

        const metadata = await getGroupMetadataSafe(sock, from);
        if (!metadata) {
            return sock.sendMessage(from, { text: "❌ Impossible de récupérer les informations de ce groupe pour le moment." });
        }

        const admins = metadata.participants.filter(participantIsAdmin);

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*ℹ️ INFOS DU GROUPE*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
📛 *Nom* : ${metadata.subject}
🆔 *ID* : ${metadata.id}
📝 *Description* : ${metadata.desc || "_Aucune_"}
👥 *Membres* : ${metadata.participants.length}
🛡️ *Admins* (${admins.length}) : ${admins.map(a => `@${a.id.split("@")[0]}`).join(", ") || "_Aucun_"}
🔒 *Verrouillé* : ${metadata.announce ? "Oui (seuls les admins peuvent écrire)" : "Non"}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Consulté par @${senderNumber}_
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: admins.map(a => a.id)
        });
    }
};
