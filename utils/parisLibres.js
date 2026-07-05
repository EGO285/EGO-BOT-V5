const fs = require("fs");

const dbPath = "./data/parisLibres.json";

function loadDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ active: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(db) {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
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

module.exports = { loadDB, saveDB, calculerCotes, dbPath };
