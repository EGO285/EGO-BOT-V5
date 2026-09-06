// ============================================================
//  utils/evoMedia.js
//  Récupère une image d'un message WhatsApp (image jointe OU image
//  citée en réponse) et la convertit en data URL base64, prête à être
//  envoyée à un modèle de vision Hugging Face.
// ============================================================

const { downloadMediaMessage } = require("@whiskeysockets/baileys");

const MAX_BYTES = 4 * 1024 * 1024; // 4 Mo : au-delà on n'envoie pas (payload trop lourd)

// Localise l'imageMessage à traiter et construit un "message" téléchargeable.
function locateImage(m) {
    // 1) image envoyée directement (avec légende !evo / !arbitre)
    if (m.message?.imageMessage) {
        return { imageMessage: m.message.imageMessage, downloadable: m };
    }
    // 2) image citée en réponse
    const ctx = m.message?.extendedTextMessage?.contextInfo;
    const quoted = ctx?.quotedMessage;
    if (quoted?.imageMessage) {
        const downloadable = {
            key: {
                remoteJid: m.key.remoteJid,
                id: ctx.stanzaId,
                participant: ctx.participant,
                fromMe: false,
            },
            message: quoted,
        };
        return { imageMessage: quoted.imageMessage, downloadable };
    }
    return null;
}

// Retourne true si le message (ou le message cité) contient une image.
function hasImage(m) {
    return !!locateImage(m);
}

// Télécharge l'image et renvoie une data URL "data:image/...;base64,...",
// ou null si pas d'image / trop lourde / échec.
async function getImageDataUrl(sock, m) {
    const found = locateImage(m);
    if (!found) return null;

    const declaredSize = found.imageMessage.fileLength
        ? Number(found.imageMessage.fileLength)
        : 0;
    if (declaredSize && declaredSize > MAX_BYTES) {
        return { tooLarge: true };
    }

    try {
        const buffer = await downloadMediaMessage(
            found.downloadable,
            "buffer",
            {},
            { reuploadRequest: sock.updateMediaMessage }
        );
        if (!buffer || buffer.length > MAX_BYTES) return { tooLarge: true };

        const mime = found.imageMessage.mimetype || "image/jpeg";
        return { dataUrl: `data:${mime};base64,${buffer.toString("base64")}` };
    } catch (e) {
        console.error("⚠️ E.V.O : téléchargement image échoué :", e.message);
        return null;
    }
}

module.exports = { hasImage, getImageDataUrl };
