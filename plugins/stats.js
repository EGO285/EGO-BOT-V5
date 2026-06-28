const { getGlobalStats } = require("../utils/users");

module.exports = {
    command: "!stats",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const arg = text.replace("!stats", "").trim().toLowerCase();

        if (arg !== "globales" && arg !== "globale" && arg !== "global") {
            return sock.sendMessage(from, {
                text: "❌ Exemple : *!stats globales*"
            });
        }

        const s = await getGlobalStats();

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🌐 STATISTIQUES GLOBALES*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
👥 Joueurs enregistrés : *${s.totalJoueurs}*
💰 Ryo total en circulation : *${s.totalRyo}🔶*
⭐ Stars total en circulation : *${s.totalStars}⭐*
🎴 Cartes possédées (toutes collections) : *${s.totalCartesVendues}*
🏆 Victoires totales : *${s.totalVictoires}*
😭 Défaites totales : *${s.totalDefaites}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Consultées par @${senderNumber}_
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
