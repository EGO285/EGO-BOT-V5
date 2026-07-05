module.exports = {
    command: "!listegroupes",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        let groupes;
        try {
            groupes = await sock.groupFetchAllParticipating();
        } catch (err) {
            console.error("Erreur !listegroupes:", err);
            return sock.sendMessage(from, { text: "❌ Impossible de récupérer la liste des groupes pour le moment." });
        }

        const liste = Object.values(groupes);

        if (!liste.length) {
            return sock.sendMessage(from, { text: "ℹ️ Le bot n'est présent dans aucun groupe pour le moment." });
        }

        const lignes = liste.map(g =>
            `📌 *${g.subject || "(sans nom)"}*\n🆔 ${g.id}\n👥 ${g.participants?.length || 0} membres`
        ).join("\n\n");

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🗂️ GROUPES DU BOT (${liste.length})*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
${lignes}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Utilise !quittergroupe <id> pour faire quitter le bot d'un groupe._
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`
        });
    }
};
