module.exports = {
    command: "!rules",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        await sock.sendMessage(from, {
            text: `📋 @${senderNumber} voici les règles :`,
            mentions: [senderJid]
        });

        const images = [
            "https://i.ibb.co/ZzsxvcYY/b3edb23ee626.jpg",
            "https://i.ibb.co/LzMsjndX/9ef21b601c62.jpg",
            "https://i.ibb.co/v6Yhs4wX/290147e6c040.jpg"
        ];

        for (let img of images) {
            await sock.sendMessage(from, { image: { url: img } });
        }
    }
};
