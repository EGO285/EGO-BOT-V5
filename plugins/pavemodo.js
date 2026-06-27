module.exports = {
    command: "!pave modo",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        await sock.sendMessage(from, {
            text:
`*══════════════*
       *🎮PAVÉ-MODO🎮*
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
*🏟️DISTANCE:7m*
*⌚️LATENCE:5min+2add*
*🔴PORTÉE:8m*
*⚖️MODO:Lone T Atlas*
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
         *🎮REGLES DUEL🎮*
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
_1️⃣:Respectez le modo,sa décision est irrévocable_
_2️⃣:Latence est synonyme d'immobilité,MC également_
_3️⃣:Un pavé sans photo du perso sera refuser_
_4️⃣ La precision est primordial, en cas de manque de précision pour une action , cette dernière sera annulée_
_5️⃣:En cas de contretemps, vous pouvez demander une pause de 10min , passer ce délai , vous serez forfait_
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
     *🔶SHINOBI STORM🎮*
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓`
        });
    }
};
