// Ajoute/change l'image associée à la fiche d'un joueur.
// Usage :
//   - !fichephoto <pseudo> <url_image>
//   - ou en réponse à une image : !fichephoto <pseudo>
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const { getUser, saveUser, buildFiche } = require("../utils/users");

const PHOTOS_DIR = path.join(__dirname, "..", "fiches_photos");
if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true });

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
    command: "!fichephoto",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const args = text.replace("!fichephoto", "").trim().split(" ");
        const pseudo = args[0];
        const url = args[1];

        if (!pseudo) {
            return sock.sendMessage(from, {
                text: "❌ Exemple : *!fichephoto paul <url_image>*\n_Ou réponds à une image avec !fichephoto paul_"
            });
        }

        const key = pseudo.toLowerCase();
        const user = await getUser(key);

        if (!user) {
            return sock.sendMessage(from, { text: `❌ Joueur *${pseudo}* introuvable.` });
        }

        // Cas 1 : URL fournie directement
        if (url) {
            user.photo = url;
            await saveUser(key, user);
            return sock.sendMessage(from, {
                image: { url },
                caption: `✅ Image de fiche mise à jour pour *${user.pseudo}* par @${senderNumber}.`,
                mentions: [senderJid]
            });
        }

        // Cas 2 : image jointe en réponse
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMessage = quoted?.imageMessage || m.message?.imageMessage;

        if (!imageMessage) {
            return sock.sendMessage(from, {
                text: "❌ Aucune image trouvée.\n\n👉 Réponds à une image avec *!fichephoto " + pseudo + "*\n👉 Ou utilise *!fichephoto " + pseudo + " <url_image>*"
            });
        }

        try {
            const { downloadMediaMessage } = require("@whiskeysockets/baileys");

            const fakeMsg = quoted
                ? { key: m.message.extendedTextMessage.contextInfo, message: quoted }
                : m;

            const buffer = await downloadMediaMessage(fakeMsg, "buffer", {});
            const filePath = path.join(PHOTOS_DIR, `${key}.jpg`);
            fs.writeFileSync(filePath, buffer);

            // Stockage local persistant (un fichier par joueur, ne s'écrase pas entre joueurs).
            // ⚠️ Si ton hébergeur (ex: Render) a un filesystem éphémère sans disque persistant,
            // ces images seront perdues au redéploiement — héberger ailleurs (catbox, Cloudinary)
            // et stocker l'URL serait plus robuste dans ce cas.
            user.photo = filePath;
            await saveUser(key, user);

            return sock.sendMessage(from, {
                image: { url: filePath },
                caption: `✅ Image de fiche mise à jour pour *${user.pseudo}* par @${senderNumber}.`,
                mentions: [senderJid]
            });
        } catch (e) {
            console.error("Erreur !fichephoto :", e);
            return sock.sendMessage(from, {
                text: "❌ Une erreur est survenue lors de la mise à jour de l'image. Réessaie."
            });
        }
    }
};
