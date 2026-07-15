// ============================================================
//  utils/groupPermissions.js
//  Fonctions communes utilisées par les commandes admin de groupe
//  (!tagall, !kick, !promote, !demote, !setgroupname, !setgroupdesc,
//  !fermergroupe, !ouvrirgroupe...) :
//    - vérifie qu'on est bien dans un groupe WhatsApp
//    - vérifie que l'auteur a la permission : admin du GROUPE WhatsApp,
//      OU admin du BOT (liste ADMIN_NUMBERS dans index.js, déjà calculée
//      en amont et transmise aux plugins via { isAdmin })
//    - pour les actions qui modifient le groupe (kick, promote, demote,
//      changement de nom/description, verrouillage), vérifie en plus que
//      le BOT LUI-MÊME est admin du groupe — sans ça, WhatsApp refuse
//      l'action côté serveur.
// ============================================================

const { jidNormalizedUser } = require("@whiskeysockets/baileys");

function isGroupJid(jid) {
    return typeof jid === "string" && jid.endsWith("@g.us");
}

// Récupère les métadonnées du groupe, ou null en cas d'erreur (bot pas dans
// le groupe, groupe supprimé, coupure réseau...) au lieu de laisser planter
// la commande qui appelle cette fonction.
async function getGroupMetadataSafe(sock, jid) {
    try {
        return await sock.groupMetadata(jid);
    } catch (e) {
        console.error("Erreur récupération métadonnées groupe:", e.message);
        return null;
    }
}

function participantIsAdmin(participant) {
    return participant?.admin === "admin" || participant?.admin === "superadmin";
}

function findParticipant(metadata, jid) {
    const target = jidNormalizedUser(jid);
    return metadata.participants.find(p => jidNormalizedUser(p.id) === target);
}

// Vérifie que l'auteur du message peut utiliser une commande admin de groupe :
// soit il est admin du groupe WhatsApp, soit il est admin du bot (isAdmin).
// Renvoie { ok: true, metadata } ou { ok: false, error }.
async function requirePermission(sock, jid, senderJid, isAdmin) {
    const metadata = await getGroupMetadataSafe(sock, jid);
    if (!metadata) {
        return { ok: false, error: "❌ Impossible de récupérer les informations de ce groupe pour le moment." };
    }

    if (isAdmin) {
        return { ok: true, metadata };
    }

    const senderIsGroupAdmin = participantIsAdmin(findParticipant(metadata, senderJid));
    if (!senderIsGroupAdmin) {
        return { ok: false, error: "⛔ Cette commande est réservée aux *admins du groupe* (ou aux admins du bot)." };
    }

    return { ok: true, metadata };
}

// Vérifie que le BOT est admin du groupe (obligatoire pour kick/promote/demote/
// changer le nom ou la description/verrouiller). metadata peut être passée si
// déjà récupérée par requirePermission(), pour éviter un second appel réseau.
async function requireBotIsGroupAdmin(sock, jid, metadata) {
    const meta = metadata || await getGroupMetadataSafe(sock, jid);
    if (!meta) {
        return { ok: false, error: "❌ Impossible de récupérer les informations de ce groupe pour le moment." };
    }

    const botIsAdmin = participantIsAdmin(findParticipant(meta, sock.user?.id));
    if (!botIsAdmin) {
        return { ok: false, error: "⛔ Le *bot* doit lui-même être admin de ce groupe pour exécuter cette action." };
    }

    return { ok: true };
}

module.exports = {
    isGroupJid,
    getGroupMetadataSafe,
    participantIsAdmin,
    requirePermission,
    requireBotIsGroupAdmin,
};
