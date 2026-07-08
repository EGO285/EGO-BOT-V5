// ============================================================
//  utils/achatsEnAttente.js
//  Quand un joueur a des tickets de réduction disponibles, !acheter
//  ne finalise pas tout de suite : on stocke l'achat "en attente" ici
//  le temps que le joueur réponde avec !confirmerachat oui/non.
//
//  Stockage en mémoire (pas besoin de survivre à un redémarrage — une
//  confirmation en attente depuis plus de 5 minutes n'a plus vraiment
//  de sens) et expire automatiquement.
// ============================================================

const TTL_MS = 5 * 60 * 1000; // 5 minutes

const pending = new Map(); // clé: "<chatJid>:<pseudo_lowercase>" -> { carte, choix, expiresAt }

function cle(chatJid, pseudo) {
    return `${chatJid}:${pseudo.toLowerCase()}`;
}

function setPending(chatJid, pseudo, data) {
    pending.set(cle(chatJid, pseudo), { ...data, expiresAt: Date.now() + TTL_MS });
}

function getPending(chatJid, pseudo) {
    const k = cle(chatJid, pseudo);
    const entry = pending.get(k);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        pending.delete(k);
        return null;
    }
    return entry;
}

function clearPending(chatJid, pseudo) {
    pending.delete(cle(chatJid, pseudo));
}

module.exports = { setPending, getPending, clearPending };
