const { claimDaily } = require("../utils/users");

module.exports = {
    command: "!daily",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const pseudo = text.replace("!daily", "").trim();

        const result = await claimDaily(pseudo);

        if (!result.ok) {
            return sock.sendMessage(from, { text: result.error });
        }

        const { user, gainMoney, gainStars } = result;

        await sock.sendMessage(from, {
            text:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🎁 RÉCOMPENSE QUOTIDIENNE*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Réclamée par @${senderNumber}_

✅ +${gainMoney}🔶
✅ +${gainStars}⭐
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💰 Bourse : *${user.money}🔶*
⭐ Stars : *${user.stars}⭐*
_Reviens demain pour ta prochaine récompense !_
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
