// ============================================================
//  utils/users.js
//  Fonctions centralisées de lecture/écriture des fiches joueurs,
//  désormais stockées sur Upstash Redis (persistant entre redéploiements)
//  au lieu d'un fichier JSON local (perdu à chaque redéploiement Render).
//
//  Structure de stockage :
//    - clé "user:<pseudo>"   -> JSON de la fiche joueur
//    - clé "users:index"     -> Set Redis contenant tous les pseudos existants
// ============================================================

const { Redis } = require("@upstash/redis");

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error("❌ UPSTASH_REDIS_REST_URL et/ou UPSTASH_REDIS_REST_TOKEN manquant(s) dans les variables d'environnement.");
    console.error("   Configure-les sur Render (Environment) avec les valeurs trouvées sur ton tableau de bord Upstash, section 'REST API'.");
}

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const USER_PREFIX = "user:";
const INDEX_KEY = "users:index";

function userKey(pseudo) {
    return `${USER_PREFIX}${pseudo.toLowerCase()}`;
}

// Charge la fiche d'un seul joueur (ou null s'il n'existe pas)
async function getUser(pseudo) {
    const user = await redis.get(userKey(pseudo));
    return user || null;
}

// Sauvegarde une fiche joueur et l'ajoute à l'index si nouvelle
async function saveUser(pseudo, userData) {
    const key = pseudo.toLowerCase();
    await redis.set(userKey(key), userData);
    await redis.sadd(INDEX_KEY, key);
    return userData;
}

// Supprime une fiche joueur (utilisé par !delete)
async function deleteUser(pseudo) {
    const key = pseudo.toLowerCase();
    await redis.del(userKey(key));
    await redis.srem(INDEX_KEY, key);
}

// Charge TOUTES les fiches joueurs (utilisé par !classement, !rang, et la mise à jour du ranking)
async function loadAllUsers() {
    const keys = await redis.smembers(INDEX_KEY);
    if (!keys || keys.length === 0) return {};

    const db = {};
    // Upstash permet de récupérer plusieurs clés en un seul appel (mget),
    // plus efficace que boucler avec un getUser() par joueur.
    const fullKeys = keys.map(userKey);
    const values = await redis.mget(...fullKeys);

    keys.forEach((key, i) => {
        if (values[i]) db[key] = values[i];
    });

    return db;
}

// Recalcule le rang de chaque joueur selon ses points, et sauvegarde
// uniquement ceux dont le rang a changé (évite des écritures inutiles).
async function updateRanking(db) {
    const users = Object.values(db);
    users.sort((a, b) => (b.points || 0) - (a.points || 0));

    const writes = [];
    users.forEach((u, i) => {
        const key = u.pseudo.toLowerCase();
        const newRank = i + 1;
        if (db[key].rank !== newRank) {
            db[key].rank = newRank;
            writes.push(saveUser(key, db[key]));
        }
    });

    await Promise.all(writes);
    return db;
}

function buildFiche(u) {
    const inventaire = Array.isArray(u.inventaire) && u.inventaire.length
        ? u.inventaire.map(nom => `🎴 ${nom}`).join("\n")
        : "_Aucune carte achetée pour le moment._";

    return `*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🥇Fiche Shinobi Ultimate League🏆*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_▲Pseudo👤:_ ${u.pseudo}

_▲DIVISION⚪️: *${u.division}⚪️*_

_▲BOURSE💰: *${u.money}🔶*_

_▲STARS⭐️ : *${u.stars}⭐️*_

_▲Card de Réduction 🎟: *${u.cards || 0} 🎟*_
▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰
░░░░░░░░░░░░░░░░░░░
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_*🔢Records*:_
_${u.wins} Victoires🏆/ ${u.loses} Défaite😭_
_*🏆 Points*: ${u.points || 0}🌟_

_RANG *SUL🏅*: ${u.rank || "N/A"}ème_
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_🛍🛒ACHATS CARDS: _*
▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰
${inventaire}
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`;
}

// ──────────────────────────────────────────────
// Construit un message d'interface générique dans le style "Shinobi Storm RP"
// utilisé par défaut pour toutes les commandes/menus du bot.
// titre  : ex "CASINO EGO BOT", "BOUTIQUE DE CARTES"
// lignes : tableau de chaînes (le corps du message)
// footer : texte de bas de page optionnel (avant le cadre de fin)
// ──────────────────────────────────────────────
function buildInterface({ titre, lignes = [], footer = "" }) {
    const corps = lignes.join("\n");
    return `*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*${titre}*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
${corps}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔${footer ? `\n${footer}\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔` : ""}
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`;
}

// ──────────────────────────────────────────────
// Logique commune à tous les jeux de casino :
// vérifie que le joueur a une fiche et assez d'argent
// pour la mise demandée.
// ──────────────────────────────────────────────
async function checkCanPlay(pseudo, mise) {
    if (!pseudo) {
        return { ok: false, error: "❌ Indique ton pseudo. Exemple : *!pof paul*" };
    }

    const key = pseudo.toLowerCase();
    const user = await getUser(key);

    if (!user) {
        return { ok: false, error: `❌ Joueur *${pseudo}* introuvable. Crée ta fiche avec *!new ${pseudo}*.` };
    }

    if ((user.money || 0) < mise) {
        return {
            ok: false,
            error: `❌ Fonds insuffisants.\n💰 Bourse actuelle : *${user.money}🔶*\n🎯 Mise requise : *${mise}🔶*`
        };
    }

    return { ok: true, key, user };
}

// Applique le résultat d'une partie de casino : déduit la mise,
// ajoute le gain (0 si perdu), sauvegarde.
async function applyCasinoResult(key, user, mise, gain) {
    user.money = (user.money || 0) - mise + gain;
    await saveUser(key, user);
    return user;
}

// ──────────────────────────────────────────────
// Parse une entrée de prix telle que stockée dans cartes.json,
// ex: "8000🔶" -> { montant: 8000, devise: "money" }
//     "3⭐"    -> { montant: 3, devise: "stars" }
// Une chaîne sans emoji ni reconnaissable est ignorée (retourne null).
// ──────────────────────────────────────────────
function parsePrix(entree) {
    if (typeof entree !== "string") return null;

    const nombre = parseInt(entree.replace(/[^\d]/g, ""), 10);
    if (isNaN(nombre)) return null;

    if (entree.includes("⭐")) return { montant: nombre, devise: "stars" };
    if (entree.includes("🔶")) return { montant: nombre, devise: "money" };

    // Pas d'emoji : par défaut on considère que c'est du Ryo
    return { montant: nombre, devise: "money" };
}

// ──────────────────────────────────────────────
// Vérifie qu'un achat de carte est possible pour ce joueur, et si oui,
// l'exécute (déduction + ajout à l'inventaire + sauvegarde).
// Le joueur a le choix de la devise quand la carte propose plusieurs prix :
// on prend le premier prix de la liste que le joueur peut se permettre.
// ──────────────────────────────────────────────
async function checkAndBuyCard(pseudo, carte) {
    if (!pseudo) {
        return { ok: false, error: "❌ Indique ton pseudo. Exemple : *!acheter Naruto Uzumaki paul*" };
    }

    const key = pseudo.toLowerCase();
    const user = await getUser(key);

    if (!user) {
        return { ok: false, error: `❌ Joueur *${pseudo}* introuvable. Crée ta fiche avec *!new ${pseudo}*.` };
    }

    const prixListe = Array.isArray(carte.prix) ? carte.prix.map(parsePrix).filter(Boolean) : [];

    if (!prixListe.length) {
        return { ok: false, error: `❌ La carte *${carte.nom}* n'a pas encore de prix défini. Demande à un admin de le configurer.` };
    }

    // Cherche le premier prix (Ryo ou Stars) que le joueur peut payer
    const choix = prixListe.find(p =>
        (p.devise === "money" && (user.money || 0) >= p.montant) ||
        (p.devise === "stars" && (user.stars || 0) >= p.montant)
    );

    if (!choix) {
        const detail = prixListe.map(p => p.devise === "money" ? `${p.montant}🔶` : `${p.montant}⭐`).join(" ou ");
        return {
            ok: false,
            error: `❌ Fonds insuffisants pour *${carte.nom}*.\n💰 Bourse : *${user.money}🔶* — ⭐ Stars : *${user.stars}*\n🎯 Prix demandé : *${detail}*`
        };
    }

    if (choix.devise === "money") {
        user.money = (user.money || 0) - choix.montant;
    } else {
        user.stars = (user.stars || 0) - choix.montant;
    }

    if (!Array.isArray(user.inventaire)) user.inventaire = [];
    user.inventaire.push(carte.nom);
    user.cards = user.inventaire.length;

    await saveUser(key, user);

    return { ok: true, user, prixPaye: choix };
}

module.exports = {
    getUser,
    saveUser,
    deleteUser,
    loadAllUsers,
    updateRanking,
    buildFiche,
    buildInterface,
    checkCanPlay,
    applyCasinoResult,
    parsePrix,
    checkAndBuyCard,
};
