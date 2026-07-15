// !broadcast <message> — (Admin bot) diffuse un message dans TOUS les groupes
// où le bot est actuellement présent. Utile pour une annonce générale (maintenance,
// nouvel événement, etc.) sans avoir à la coller manuellement dans chaque groupe.
module.exports = {
    command: "!broadcast",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const message = text.replace("!broadcast", "").trim();

        if (!message) {
            return sock.sendMessage(from, { text: "❌ Format : *!broadcast <message>*" });
        }

        let groupes;
        try {
            groupes = await sock.groupFetchAllParticipating();
        } catch (e) {
            console.error("Erreur !broadcast (récupération groupes):", e);
            return sock.sendMessage(from, { text: "❌ Impossible de récupérer la liste des groupes pour le moment." });
        }

        const ids = Object.keys(groupes);
        if (!ids.length) {
            return sock.sendMessage(from, { text: "ℹ️ Le bot n'est présent dans aucun groupe pour le moment." });
        }

        const texteDiffuse =
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*📣 ANNONCE*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
${message}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`;

        let envoyes = 0;
        let echecs = 0;

        for (const id of ids) {
            try {
                await sock.sendMessage(id, { text: texteDiffuse });
                envoyes++;
            } catch (e) {
                console.error(`Erreur !broadcast (envoi vers ${id}):`, e.message);
                echecs++;
            }
        }

        await sock.sendMessage(from, {
            text: `✅ Diffusion terminée par @${senderNumber} : *${envoyes}* groupe(s) touché(s)${echecs ? `, *${echecs}* échec(s)` : ""}.`,
            mentions: [senderJid]
        });
    }
};
