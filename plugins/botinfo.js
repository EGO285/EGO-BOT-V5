const fs = require("fs");
const path = require("path");
module.exports = {
    command: "!botinfo",
    async handler(sock, m, text) {
        const from = m.key.remoteJid;
        let nb = 0;
        try { nb = fs.readdirSync(path.join(__dirname)).filter(f => f.endsWith(".js")).length; } catch (e) {}
        await sock.sendMessage(from, {
            text:
`🤖 *E.V.O — EGO VIRTUAL OPERATOR*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
🧩 Commandes chargées : *${nb}*
🗄️ Base de données : *Upstash Redis*
📱 Plateforme : *WhatsApp (Baileys)*
🧠 Moteur : *E.V.O Core*
👑 Créé par : *ego*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Tape !menu pour la liste des commandes,_
_!about pour en savoir plus sur moi._`,
        });
    }
};
