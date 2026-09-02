module.exports = {
    command: "!about",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*🤖 E.V.O — EGO VIRTUAL OPERATOR*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
Salut @${senderNumber}, je suis *E.V.O*, l'*EGO VIRTUAL OPERATOR*.

Je suis un assistant virtuel conçu et façonné par *ego* pour faire tourner ce serveur : je gère les fiches joueurs, l'économie, le casino, la banque RP, la modération des groupes et une tonne de commandes fun.

Je ne suis pas juste un bot qui répond « oui/non » : je m'exprime, je te réponds différemment à chaque fois, et si tu tapes une commande de travers, je te souffle ce que tu voulais sûrement écrire.

🧠 *Mon créateur* : ego
⚙️ *Mon rôle* : ton opérateur virtuel, disponible 24h/24
💾 *Ma mémoire* : base de données Upstash (rien ne se perd)
🗣️ *Ma particularité* : des réponses vivantes, jamais tout à fait les mêmes
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Parle-moi avec *!evo <message>*, ou tape *!menu* pour voir tout ce que je sais faire._
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid],
        });
    }
};
