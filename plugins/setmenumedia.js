const fs = require("fs");
const path = require("path");
const { setMenuMedia, MENUS_CONNUS } = require("../utils/menuMedia");

const MEDIA_DIR = path.join(__dirname, "..", "menu_medias");
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

module.exports = {
    command: "!setmenumedia",
    adminOnly: true,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const args = text.replace("!setmenumedia", "").trim().split(" ");
        const nom = (args[0] || "").toLowerCase();
        const url = args[1];

        if (!nom) {
            return sock.sendMessage(from, {
                text:
`❌ Format : *!setmenumedia <nom_du_menu> <url>*\n_Ou réponds à une image/vidéo avec !setmenumedia <nom_du_menu>_\n\nMenus disponibles : ${MENUS_CONNUS.map(n => `*${n}*`).join(", ")}`
            });
        }

        // Cas 1 : URL fournie directement (image OU vidéo, détecté par l'extension)
        if (url) {
            const media = await setMenuMedia(nom, url);
            try {
                await sock.sendMessage(from, {
                    [media.type]: { url: media.url },
                    caption: `✅ Média du menu *${nom}* mis à jour (${media.type}) par @${senderNumber}.`,
                    mentions: [senderJid]
                });
            } catch (e) {
                await sock.sendMessage(from, {
                    text: `⚠️ Média enregistré, mais impossible de le prévisualiser (l'URL semble cassée ou inaccessible : ${e.message}).\nVérifie le lien avant de compter dessus — sinon *!menu*/*!latence* afficheront le texte seul en repli.`,
                    mentions: [senderJid]
                });
            }
            return;
        }

        // Cas 2 : image ou vidéo jointe en réponse
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMessage = quoted?.imageMessage || m.message?.imageMessage;
        const videoMessage = quoted?.videoMessage || m.message?.videoMessage;
        const mediaMessage = imageMessage || videoMessage;

        if (!mediaMessage) {
            return sock.sendMessage(from, {
                text:
`❌ Aucune image/vidéo trouvée.\n\n👉 Réponds à une image ou une vidéo avec *!setmenumedia ${nom}*\n👉 Ou utilise *!setmenumedia ${nom} <url>*`
            });
        }

        try {
            const { downloadMediaMessage } = require("@whiskeysockets/baileys");

            const fakeMsg = quoted
                ? { key: m.message.extendedTextMessage.contextInfo, message: quoted }
                : m;

            const type = videoMessage ? "video" : "image";
            const ext = type === "video" ? "mp4" : "jpg";
            const buffer = await downloadMediaMessage(fakeMsg, "buffer", {});
            const filePath = path.join(MEDIA_DIR, `${nom}.${ext}`);
            fs.writeFileSync(filePath, buffer);

            // ⚠️ Stockage local : sur un hébergeur au filesystem éphémère (Render sans
            // disque persistant), ce fichier sera perdu au redéploiement. Pour un média
            // durable, héberge-le ailleurs (catbox, Cloudinary...) et utilise plutôt
            // !setmenumedia <nom> <url>.
            const media = await setMenuMedia(nom, filePath, type);

            return sock.sendMessage(from, {
                [media.type]: { url: filePath },
                caption: `✅ Média du menu *${nom}* mis à jour (${media.type}) par @${senderNumber}.\n⚠️ Stocké localement : ré-uploade-le si tu redéploies le bot.`,
                mentions: [senderJid]
            });
        } catch (e) {
            console.error("Erreur !setmenumedia :", e);
            return sock.sendMessage(from, {
                text: "❌ Une erreur est survenue lors de la mise à jour du média. Réessaie."
            });
        }
    }
};
