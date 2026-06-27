module.exports = {
    command: "!casino",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        await sock.sendMessage(from, {
            image: { url: "https://files.catbox.moe/04bcjy.jpg" },
            caption:
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🎰 CASINO EGO BOT*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Tente ta chance, Shinobi !_
_Chaque jeu déduit ta mise de ta bourse avant de jouer — choisis-la toi-même, le bot vérifie que tu as les fonds._

🪙 *!pof <pile/face> <pseudo> <mise>*
   Gain x2

🎰 *!machine <pseudo> <mise>*
   Paire x2 — Triple x5 — Jackpot x10

🎲 *!des <plus/moins/exact> <pseudo> <mise>*
   Gain x1.8 à x4

🎡 *!roulette <rouge/noir/vert> <pseudo> <mise>*
   Gain x2 (rouge/noir), x14 (vert)

🃏 *!hl <plus/moins> <pseudo> <mise>*
   Gain x1.8
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_Demandé par @${senderNumber}_
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`,
            mentions: [senderJid]
        });
    }
};
