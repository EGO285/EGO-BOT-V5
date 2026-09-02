// ============================================================
//  utils/quizState.js
//  État partagé du quiz entre !quiz (pose la question) et !rep (répond).
//  active[chatJid] = { reponse, question, expire }
// ============================================================

const active = {};

const QUESTIONS = [
    { q: "Combien de côtés a un hexagone ?", r: ["6", "six"] },
    { q: "Quelle est la capitale du Japon ?", r: ["tokyo"] },
    { q: "En quelle année a eu lieu la première Coupe du monde de football ?", r: ["1930"] },
    { q: "Quel est le plus grand océan du monde ?", r: ["pacifique"] },
    { q: "Combien font 7 x 8 ?", r: ["56"] },
    { q: "Quelle planète est surnommée la planète rouge ?", r: ["mars"] },
    { q: "Quel animal est le roi de la jungle ?", r: ["lion", "le lion"] },
    { q: "Combien y a-t-il de continents ?", r: ["7", "sept"] },
    { q: "Quelle est la couleur obtenue en mélangeant bleu et jaune ?", r: ["vert", "le vert"] },
    { q: "Quel est le symbole chimique de l'or ?", r: ["au"] },
    { q: "Combien de joueurs dans une équipe de football sur le terrain ?", r: ["11", "onze"] },
    { q: "Quel est le fruit associé à Isaac Newton et la gravité ?", r: ["pomme", "la pomme"] },
    { q: "Quelle est la capitale de l'Italie ?", r: ["rome"] },
    { q: "Combien font 12 au carré ?", r: ["144"] },
    { q: "Quel est l'organe qui pompe le sang ?", r: ["coeur", "cœur", "le coeur"] },
];

module.exports = { active, QUESTIONS };
