module.exports = {
    command: "!pave ego",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        await sock.sendMessage(from, {
            text:
`🔶EGOTYPE PAVÉ RP🎮
▔▔▔▔▔░▒▒▒▒░░▒░░▒

*💬Mots:*
———————————————-

*🎮ACTIONS🎮*
👊🏼: 
———————————————

🔶SHINOBI STORM RP🎮
░▒▒▒▒░░▒░░▒▒░░▒`
        });
    }
};
