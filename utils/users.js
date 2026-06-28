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

// ──────────────────────────────────────────────
// Ajoute une entrée au journal (logs) d'un joueur.
// On garde seulement les 20 dernières entrées pour ne pas alourdir la fiche.
// type: "achat" | "vente" | "echange" | "casino" | "daily" | "admin"
// ──────────────────────────────────────────────
function pushLog(user, type, detail) {
    if (!Array.isArray(user.logs)) user.logs = [];
    user.logs.unshift({
        type,
        detail,
        date: new Date().toISOString(),
    });
    user.logs = user.logs.slice(0, 20);
}

// ──────────────────────────────────────────────
// Vend une carte de l'inventaire du joueur contre du Ryo.
// Prix de vente = 50% du prix d'achat en Ryo (ou en Stars converti, voir note).
// Retire UNE seule occurrence de la carte de l'inventaire.
// ──────────────────────────────────────────────
async function checkAndSellCard(pseudo, carte) {
    if (!pseudo) {
        return { ok: false, error: "❌ Indique ton pseudo. Exemple : *!vendre Naruto Uzumaki paul*" };
    }

    const key = pseudo.toLowerCase();
    const user = await getUser(key);

    if (!user) {
        return { ok: false, error: `❌ Joueur *${pseudo}* introuvable.` };
    }

    if (!Array.isArray(user.inventaire) || !user.inventaire.includes(carte.nom)) {
        return { ok: false, error: `❌ *${user.pseudo}* ne possède pas la carte *${carte.nom}*.` };
    }

    const prixListe = Array.isArray(carte.prix) ? carte.prix.map(parsePrix).filter(Boolean) : [];
    if (!prixListe.length) {
        return { ok: false, error: `❌ La carte *${carte.nom}* n'a pas de prix défini, impossible de la revendre.` };
    }

    // On revend toujours en Ryo, à 50% du premier prix en Ryo trouvé
    // (si la carte n'a qu'un prix en Stars, on convertit grossièrement : 1⭐ = 10000🔶)
    const prixMoney = prixListe.find(p => p.devise === "money");
    const montantBase = prixMoney ? prixMoney.montant : prixListe[0].montant * 10000;
    const gain = Math.round(montantBase * 0.5);

    // Retire une seule occurrence de la carte
    const index = user.inventaire.indexOf(carte.nom);
    user.inventaire.splice(index, 1);
    user.cards = user.inventaire.length;
    user.money = (user.money || 0) + gain;

    pushLog(user, "vente", `Vendu ${carte.nom} pour ${gain}🔶`);
    await saveUser(key, user);

    return { ok: true, user, gain };
}

// ──────────────────────────────────────────────
// Échange une carte entre deux joueurs (1 pour 1, sans paiement).
// pseudoA propose une carte de SA collection au pseudoB.
// ──────────────────────────────────────────────
async function checkAndExchangeCard(pseudoA, pseudoB, nomCarte) {
    if (!pseudoA || !pseudoB) {
        return { ok: false, error: "❌ Exemple : *!echange paul Naruto Uzumaki* (puis le destinataire confirme avec !echangeaccept)" };
    }

    const keyA = pseudoA.toLowerCase();
    const keyB = pseudoB.toLowerCase();

    const userA = await getUser(keyA);
    const userB = await getUser(keyB);

    if (!userA) return { ok: false, error: `❌ Joueur *${pseudoA}* introuvable.` };
    if (!userB) return { ok: false, error: `❌ Joueur *${pseudoB}* introuvable.` };

    if (!Array.isArray(userA.inventaire) || !userA.inventaire.includes(nomCarte)) {
        return { ok: false, error: `❌ *${userA.pseudo}* ne possède pas la carte *${nomCarte}*.` };
    }

    return { ok: true, userA, userB, keyA, keyB, nomCarte };
}

// Exécute réellement le transfert de carte (appelé une fois la proposition validée)
async function executeExchange(keyA, userA, keyB, userB, nomCarte) {
    const index = userA.inventaire.indexOf(nomCarte);
    userA.inventaire.splice(index, 1);
    userA.cards = userA.inventaire.length;

    if (!Array.isArray(userB.inventaire)) userB.inventaire = [];
    userB.inventaire.push(nomCarte);
    userB.cards = userB.inventaire.length;

    pushLog(userA, "echange", `Donné ${nomCarte} à ${userB.pseudo}`);
    pushLog(userB, "echange", `Reçu ${nomCarte} de ${userA.pseudo}`);

    await saveUser(keyA, userA);
    await saveUser(keyB, userB);
}

// ──────────────────────────────────────────────
// Récompense quotidienne. Renvoie une erreur si déjà réclamée
// dans les dernières 24h (basé sur user.lastDaily, timestamp ISO).
// ──────────────────────────────────────────────
const DAILY_MONEY = 10000;
const DAILY_STARS = 1;
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

async function claimDaily(pseudo) {
    if (!pseudo) {
        return { ok: false, error: "❌ Indique ton pseudo. Exemple : *!daily paul*" };
    }

    const key = pseudo.toLowerCase();
    const user = await getUser(key);

    if (!user) {
        return { ok: false, error: `❌ Joueur *${pseudo}* introuvable. Crée ta fiche avec *!new ${pseudo}*.` };
    }

    const now = Date.now();
    const last = user.lastDaily ? new Date(user.lastDaily).getTime() : 0;
    const elapsed = now - last;

    if (elapsed < DAILY_COOLDOWN_MS) {
        const reste = DAILY_COOLDOWN_MS - elapsed;
        const heures = Math.floor(reste / (60 * 60 * 1000));
        const minutes = Math.floor((reste % (60 * 60 * 1000)) / (60 * 1000));
        return { ok: false, error: `⏳ *${user.pseudo}* a déjà réclamé sa récompense aujourd'hui.\nProchaine récompense dans *${heures}h${minutes}min*.` };
    }

    user.money = (user.money || 0) + DAILY_MONEY;
    user.stars = (user.stars || 0) + DAILY_STARS;
    user.lastDaily = new Date(now).toISOString();

    pushLog(user, "daily", `Récompense quotidienne : +${DAILY_MONEY}🔶 +${DAILY_STARS}⭐`);
    await saveUser(key, user);

    return { ok: true, user, gainMoney: DAILY_MONEY, gainStars: DAILY_STARS };
}

// ──────────────────────────────────────────────
// (Admin) Ajoute manuellement une carte du catalogue à la collection d'un joueur,
// sans paiement (cadeau admin / event).
// ──────────────────────────────────────────────
async function adminGiveCard(pseudo, carte) {
    const key = pseudo.toLowerCase();
    const user = await getUser(key);

    if (!user) {
        return { ok: false, error: `❌ Joueur *${pseudo}* introuvable.` };
    }

    if (!Array.isArray(user.inventaire)) user.inventaire = [];
    user.inventaire.push(carte.nom);
    user.cards = user.inventaire.length;

    pushLog(user, "admin", `Carte ${carte.nom} ajoutée manuellement par un admin`);
    await saveUser(key, user);

    return { ok: true, user };
}

// ──────────────────────────────────────────────
// Calcule des statistiques globales sur tous les joueurs enregistrés.
// ──────────────────────────────────────────────
async function getGlobalStats() {
    const db = await loadAllUsers();
    const users = Object.values(db);

    const totalJoueurs = users.length;
    const totalRyo = users.reduce((sum, u) => sum + (u.money || 0), 0);
    const totalStars = users.reduce((sum, u) => sum + (u.stars || 0), 0);
    const totalCartesVendues = users.reduce((sum, u) => sum + (Array.isArray(u.inventaire) ? u.inventaire.length : 0), 0);
    const totalVictoires = users.reduce((sum, u) => sum + (u.wins || 0), 0);
    const totalDefaites = users.reduce((sum, u) => sum + (u.loses || 0), 0);

    return { totalJoueurs, totalRyo, totalStars, totalCartesVendues, totalVictoires, totalDefaites };
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
    checkAndSellCard,
    checkAndExchangeCard,
    executeExchange,
    claimDaily,
    adminGiveCard,
    getGlobalStats,
    pushLog,
};
