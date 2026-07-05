module.exports = {
    command: "!quittergroupe",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const groupId = text.replace("!quittergroupe", "").trim();

        // Si aucun ID n'est donné et que la commande est tapée DANS un groupe,
        // on fait quitter le bot de ce groupe-là par défaut.
        const cible = groupId || (from.endsWith("@g.us") ? from : null);

        if (!cible) {
            return sock.sendMessage(from, {
                text: "❌ Format : *!quittergroupe <id_groupe>*\nExemple : !quittergroupe 120363012345678901@g.us\n💡 Tapée directement dans un groupe sans argument, le bot quitte ce groupe."
            });
        }

        if (!cible.endsWith("@g.us")) {
            return sock.sendMessage(from, { text: "❌ Cet identifiant ne ressemble pas à un ID de groupe WhatsApp valide (doit finir par @g.us)." });
        }

        try {
            await sock.groupLeave(cible);
        } catch (err) {
            console.error("Erreur !quittergroupe:", err);
            return sock.sendMessage(from, { text: `❌ Impossible de quitter le groupe *${cible}* (le bot n'y est peut-être pas, ou une erreur est survenue).` });
        }

        // On répond avant de quitter si la commande visait le groupe courant,
        // sinon on informe l'admin en privé.
        if (from !== cible) {
            await sock.sendMessage(from, { text: `✅ Le bot a quitté le groupe *${cible}*.` });
        }
    }
};
