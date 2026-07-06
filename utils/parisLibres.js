const fs = require("fs");

const dbPath = "./data/parisLibres.json";

function loadDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ nextId: 1, active: {} }, null, 2));
    }
    const db = JSON.parse(fs.readFileSync(dbPath));
    if (!db.nextId) db.nextId = 1;
    if (!db.active) db.active = {};
    return db;
}

function saveDB(db) {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// Génère un nouvel ID de session (unique et croissant sur toute la durée de vie du bot)
function nextSessionId(db) {
    const id = String(db.nextId);
    db.nextId += 1;
    return id;
}

// ──────────────────────────────────────────────
// Calcule les cotes décimales des deux joueurs à partir de leurs points de
// classement (!classement / !rang). Plus l'écart de points est grand, plus
// la cote de l'outsider est élevée (comme un vrai bookmaker).
//
// probaA = pointsA / (pointsA + pointsB)  — capée entre 5% et 95%
// coteA  = (1 / probaA) × 0.95            — 5% de marge "maison"
// gain si victoire = mise × cote
// ──────────────────────────────────────────────
function calculerCotes(pointsA, pointsB) {
    const pA = Math.max(pointsA, 0) + 1; // +1 pour éviter la division par zéro
    const pB = Math.max(pointsB, 0) + 1;

    let probaA = pA / (pA + pB);
    probaA = Math.min(0.95, Math.max(0.05, probaA));
    const probaB = 1 - probaA;

    const MARGE = 0.95;
    const coteA = Math.round((1 / probaA) * MARGE * 100) / 100;
    const coteB = Math.round((1 / probaB) * MARGE * 100) / 100;

    return { coteA, coteB };
}

module.exports = { loadDB, saveDB, calculerCotes, nextSessionId, dbPath };
