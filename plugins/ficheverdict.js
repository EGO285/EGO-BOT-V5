module.exports = {
    command: "!fiche verdict",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        await sock.sendMessage(from, {
            text:
`*🎮VERDICT DUEL CLASSÉ🔶*
▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
*ReSumé🎙️:*
———————————————
*MODO⚖️: EGO ATLAS VAULTZ*
*ARENE🏟️:*
*MOT DE FIN:💬*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
🎮SHINOBI STORM RP🔶`
        });
    }
};
