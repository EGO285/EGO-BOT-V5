// Change la photo de profil WhatsApp du bot lui-même.
// Usage :
//   - en réponse à une image (citée), taper !photobot
//   - ou directement !photobot <url_image>
//
// Réservé aux admins car cela modifie un paramètre visible par tout le monde sur WhatsApp.

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const TMP_PATH = path.join(__dirname, "..", "tmp_profile_pic.jpg");

function downloadToFile(url, dest) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith("https") ? https : http;
        const file = fs.createWriteStream(dest);
        client.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Téléchargement échoué (code ${res.statusCode})`));
                return;
            }
            res.pipe(file);
            file.on("finish", () => file.close(resolve));
        }).on("error", (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

module.exports = {
    command: "!photobot",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const url = text.replace("!photobot", "").trim();

        // Image fournie via une URL directe
        if (url) {
            try {
                await sock.updateProfilePicture(sock.user.id, { url });
                return sock.sendMessage(from, {
                    text: `✅ Photo de profil du bot mise à jour par @${senderNumber}.`,
                    mentions: [senderJid]
                });
            } catch (e) {
                console.error("Erreur !photobot (URL) :", e);
                return sock.sendMessage(from, {
                    text: "❌ Impossible de mettre à jour la photo avec cette URL. Vérifie qu'elle pointe bien vers une image valide."
                });
            }
        }

        // Sinon, on s'attend à ce que la commande soit envoyée en réponse à une image
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMessage = quoted?.imageMessage || m.message?.imageMessage;

        if (!imageMessage) {
            return sock.sendMessage(from, {
                text:
`❌ Aucune image trouvée.

👉 Réponds à une image avec *!photobot*
👉 Ou utilise *!photobot <url_image>*`
            });
        }

        try {
            const { downloadMediaMessage } = require("@whiskeysockets/baileys");

            // Reconstruit un objet message minimal compatible avec downloadMediaMessage
            const fakeMsg = quoted
                ? { key: m.message.extendedTextMessage.contextInfo, message: quoted }
                : m;

            const buffer = await downloadMediaMessage(fakeMsg, "buffer", {});
            fs.writeFileSync(TMP_PATH, buffer);

            await sock.updateProfilePicture(sock.user.id, { url: TMP_PATH });

            fs.unlink(TMP_PATH, () => {});

            return sock.sendMessage(from, {
                text: `✅ Photo de profil du bot mise à jour par @${senderNumber}.`,
                mentions: [senderJid]
            });
        } catch (e) {
            console.error("Erreur !photobot (image jointe) :", e);
            return sock.sendMessage(from, {
                text: "❌ Une erreur est survenue lors de la mise à jour de la photo. Réessaie avec une autre image."
            });
        }
    }
};
