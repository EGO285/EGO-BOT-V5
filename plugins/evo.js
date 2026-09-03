const { askEVO } = require("../utils/evoAI");

module.exports = {
    command: "!evo",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const message = text.replace("!evo", "").trim();

        // Mémoire PAR PERSONNE : la clé combine le chat et l'expéditeur.
        // -> dans un groupe, chacun a son propre historique avec E.V.O ;
        //    en privé, c'est naturellement la bonne personne.
        const scopeId = `${from}|${senderNumber}`;

        if (!message) {
            return sock.sendMessage(from, {
                text: "💬 Parle-moi ! *!evo <ton message>*\n_Ex : !evo explique-moi les règles du blackjack_\n_(tape !evo reset pour effacer TA conversation avec moi)_",
                mentions: [senderJid],
            });
        }

        // Petit indicateur "en train d'écrire" pour le côté vivant.
        try { await sock.sendPresenceUpdate("composing", from); } catch (e) {}

        const { text: reponse } = await askEVO(scopeId, message);

        await sock.sendMessage(from, { text: reponse, mentions: [senderJid] });
        try { await sock.sendPresenceUpdate("paused", from); } catch (e) {}
    }
};
