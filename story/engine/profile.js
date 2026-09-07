// ============================================================
//  story/engine/profile.js
//  Création / initialisation d'un personnage OC, lié à la fiche Shinobi Storm.
// ============================================================
const { baseStats, applyClanBonus, freshVitals, freshNeeds } = require("./stats");
const { CLANS } = require("../data/clans");
const { STARTER_JUTSU } = require("../data/jutsu");
const { START_LOCATION } = require("../data/locations");
const { rankByKey } = require("../data/ranks");

const SCHEMA_VERSION = 1;

// Construit un nouvel OC. `fiche` = fiche Shinobi Storm existante (pour le lien).
function createOC(pseudo, fiche, opts = {}) {
    const clanKey = (opts.clan && CLANS[opts.clan]) ? opts.clan : "sans-clan";
    const clan = CLANS[clanKey];

    const stats = applyClanBonus(baseStats(), clan);
    const affinite = opts.affinite || clan.affinite || null;

    const oc = {
        pseudo: fiche.pseudo || pseudo,
        version: SCHEMA_VERSION,
        identite: {
            prenom: opts.prenom || fiche.pseudo || pseudo,
            nom: opts.nom || "",
            surnom: opts.surnom || "",
            age: opts.age || 12,
            sexe: opts.sexe || "?",
            village: opts.village || "Konoha",
            clan: clan.nom,
            clanKey,
            origine: opts.origine || "Konoha",
            generation: opts.generation || "Nouvelle génération",
            rang: "academie",
            equipe: null,
            sensei: null,
            statut: "Élève de l'académie",
        },
        physique: { taille: opts.taille || "?", poids: opts.poids || "?", cheveux: opts.cheveux || "?", yeux: opts.yeux || "?", apparence: opts.apparence || "", cicatrices: [], vetements: opts.vetements || "tenue d'académie", accessoires: [] },
        personnalite: { personnalite: opts.personnalite || "déterminé(e)", qualites: [], defauts: [], peurs: [], ambitions: opts.ambitions || "Devenir un ninja légendaire", valeurs: [] },
        stats,
        vitals: freshVitals(stats),
        besoins: freshNeeds(),
        niveau: 1, xp: 0, xpCarriere: 0, points: rankByKey("academie").points, potentiel: opts.potentiel || 50, maitrise: 0,
        affinites: affinite ? [affinite] : [],
        kekkeiGenkai: clan.kg ? [clan.kg] : [],
        techniques: STARTER_JUTSU.map(id => ({ id, maitrise: 20 })),
        inventaire: [{ id: "kunai", qty: 5 }, { id: "shuriken", qty: 5 }, { id: "boulette_riz", qty: 2 }],
        ryo: 500,
        lieu: START_LOCATION, lieuNom: "Konoha (village)", lieuServices: ["magasin_ninja","armurerie","herboristerie","restaurant","hopital","repos"],
        quete: null, quetesFinies: [],
        relations: {}, npcMemoire: {},
        reputation: { konoha: 0, clan: 0, militaire: 0, criminel: 0, international: 0 },
        timeline: { arc: "academie", jour: 1, heure: 8, saison: "printemps", annee: 0, meteo: "clair" },
        journal: [{ t: Date.now(), txt: "Ton aventure commence à l'académie de Konoha." }],
        cooldowns: {},
        combat: null,
        difficulte: opts.difficulte || "normal",   // narratif | normal | shinobi | hardcore
        mortPermanente: !!opts.mortPermanente,
        mort: false,
        createdAt: Date.now(), updatedAt: Date.now(),
    };
    return oc;
}

// Ajoute une entrée au journal narratif (borné).
function journal(oc, txt) {
    if (!Array.isArray(oc.journal)) oc.journal = [];
    oc.journal.unshift({ t: Date.now(), txt });
    oc.journal = oc.journal.slice(0, 30);
}

module.exports = { createOC, journal, SCHEMA_VERSION };
