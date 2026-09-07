// ============================================================
//  utils/evoKnowledge.js
//  Donne à E.V.O conscience de LUI-MÊME :
//   - la liste de ses commandes (depuis la base d'aide !aide)
//   - les données LIVE de la base Upstash (joueurs, classement, stats)
//
//  Le contexte est construit à la demande selon la question, puis injecté
//  dans le prompt de !evo pour qu'il réponde sur ses commandes / sa base.
// ============================================================

const { AIDE } = require("../plugins/aide");
const { loadAllUsers, getGlobalStats } = require("./users");

// ── Catalogue des commandes (résumé + détaillé) ─────────────
function commandsList() {
    return Object.keys(AIDE).map(c => "!" + c);
}

function commandsDetailed() {
    // Regroupe par catégorie, format compact : "!cmd (usage) — description".
    const parCat = {};
    for (const [nom, info] of Object.entries(AIDE)) {
        const cat = info.category || "autres";
        if (!parCat[cat]) parCat[cat] = [];
        const admin = info.adminOnly ? " [admin]" : "";
        parCat[cat].push(`!${nom}${admin} — ${info.description}`);
    }
    return Object.entries(parCat)
        .map(([cat, lignes]) => `【${cat.toUpperCase()}】\n${lignes.join("\n")}`)
        .join("\n\n");
}

// ── Détection d'intention ───────────────────────────────────
function isBotQuestion(t) {
    return /(commande|commandes|tu peux faire|tu sais faire|tes fonctions|tes capacités|capacités|comment marche|comment fonctionne|à quoi sert|a quoi sert|liste des|tu fais quoi|que fais-tu|que sais-tu|c'est quoi ton menu|tes options|comment utiliser|comment on fait pour)/i.test(t);
}

function isDbQuestion(t) {
    return /(classement|top ?\d?|premier|dernier|combien de joueur|nombre de joueur|plus riche|le plus riche|bourse de|argent de|combien a |combien de ryo|combien de money|stats|statistique|points de|rang de|fiche de|cartes de|qui est premier|meilleur joueur|en circulation|combien de compte|liste des joueur|qui joue|joueurs enregistr)/i.test(t);
}

// ── Contexte base de données (LIVE Upstash) ─────────────────
async function buildDbContext(message) {
    let db;
    try { db = await loadAllUsers(); }
    catch (e) { return "⚠️ Base de données momentanément inaccessible."; }

    const users = Object.values(db || {});
    if (!users.length) return "La base de données ne contient aucun joueur pour le moment.";

    const parPoints = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));
    const parArgent = [...users].sort((a, b) => (b.money || 0) - (a.money || 0));
    const totalMoney = users.reduce((s, u) => s + (u.money || 0), 0);
    const totalCartes = users.reduce((s, u) => s + (Array.isArray(u.inventaire) ? u.inventaire.length : (u.cards || 0)), 0);

    const top = (arr, champ, unite) => arr.slice(0, 10)
        .map((u, i) => `${i + 1}. ${u.pseudo} — ${(u[champ] || 0)}${unite}`).join("\n");

    const blocs = [];
    blocs.push(`Nombre total de joueurs enregistrés : ${users.length}`);
    blocs.push(`Ryo total en circulation : ${totalMoney}🔶`);
    blocs.push(`Cartes possédées (total) : ${totalCartes}`);
    blocs.push(`TOP 10 par points :\n${top(parPoints, "points", "🌟")}`);
    blocs.push(`TOP 10 par bourse :\n${top(parArgent, "money", "🔶")}`);

    // Stats globales officielles si dispo
    try {
        const gs = await getGlobalStats();
        if (gs) blocs.push(`Stats globales : ${typeof gs === "string" ? gs : JSON.stringify(gs)}`);
    } catch (e) {}

    // Fiches des joueurs explicitement mentionnés dans la question
    const t = (message || "").toLowerCase();
    const mentionnes = Object.keys(db).filter(k => k.length >= 2 && new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(t));
    for (const k of mentionnes.slice(0, 3)) {
        const u = db[k];
        blocs.push(`FICHE de ${u.pseudo} : bourse ${u.money || 0}🔶, stars ${u.stars || 0}⭐, points ${u.points || 0}, rang ${u.rank || "N/A"}, victoires ${u.wins || 0}, défaites ${u.loses || 0}, cartes ${Array.isArray(u.inventaire) ? u.inventaire.length : (u.cards || 0)}, division ${u.division || "?"}`);
    }

    return blocs.join("\n\n");
}

// ── Contexte global à injecter selon la question ────────────
// Renvoie une chaîne (ou null) à ajouter au prompt système de !evo.
async function buildSelfContext(message) {
    const t = (message || "");
    const blocs = [];

    if (isBotQuestion(t)) {
        blocs.push("TES COMMANDES (préfixe ! ; tu peux les expliquer et les recommander) :\n" + commandsDetailed());
    }
    if (isDbQuestion(t)) {
        blocs.push("DONNÉES ACTUELLES DE TA BASE (Upstash, en temps réel) :\n" + (await buildDbContext(t)));
    }

    return blocs.length ? blocs.join("\n\n---\n\n") : null;
}

module.exports = { commandsList, commandsDetailed, isBotQuestion, isDbQuestion, buildDbContext, buildSelfContext };
