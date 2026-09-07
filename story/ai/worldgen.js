// ============================================================
//  story/ai/worldgen.js
//  Génération PROCÉDURALE de lieux par l'IA (Hugging Face).
//  L'IA propose le CONTENU (nom, description, ambiance, type) ; le MOTEUR
//  valide et borne les valeurs mécaniques (danger, services). Si l'IA est
//  indisponible, un générateur local prend le relais (le monde s'étend quand même).
// ============================================================
let evoAI = null;
try { evoAI = require("../../utils/evoAI"); } catch (e) {}
const rng = require("../engine/rng");
const { SHOPS } = require("../data/items");

const TYPES = ["foret", "route", "montagne", "ruines", "grotte", "riviere", "plaine", "camp", "village", "donjon", "temple", "cote", "marais", "sanctuaire"];
const SERVICES_OK = new Set([...Object.keys(SHOPS), "repos", "hopital", "entrainement"]);

// Fragments pour le repli local (sans IA).
const NOMS_LIEUX = ["Bois des Murmures", "Ravin d'Obsidienne", "Ruines de Kagerō", "Col des Brumes", "Rivière Argentée", "Plaine des Corbeaux", "Grotte Écarlate", "Temple Oublié", "Marais Fumant", "Sentier des Ombres", "Clairière Interdite", "Falaises du Nord", "Camp abandonné", "Sanctuaire du Renard", "Gorges Silencieuses"];

function slug(nom) {
    return nom.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 24) + "_" + rng.int(100, 999);
}
function clampDanger(d) { d = parseInt(d); return isNaN(d) ? rng.int(1, 4) : Math.max(0, Math.min(5, d)); }
function sanitizeServices(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.filter(s => SERVICES_OK.has(s)).slice(0, 3);
}

// Extrait un objet JSON d'une réponse texte (tolère le markdown / le bavardage).
function extractJSON(txt) {
    if (!txt) return null;
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch (e) { return null; }
}

// Génère un lieu adjacent à `fromNom`, dans la région donnée.
async function generateLocation(oc, fromNom, region) {
    const base = { nom: null, type: null, description: null, danger: null, services: [], ambiance: "" };

    if (evoAI && evoAI.hasToken && evoAI.hasToken()) {
        try {
            const sys = "Tu es un générateur de lieux pour un RPG Naruto (monde ninja). Tu réponds UNIQUEMENT par un objet JSON valide, sans texte autour.";
            const user = [
                `Génère un NOUVEAU lieu inexploré, adjacent à « ${fromNom} », dans la région : ${region}.`,
                `Format JSON strict : {"nom": string court et évocateur, "type": un de [${TYPES.join(", ")}], "description": 2 phrases immersives, "danger": entier 0-5, "services": sous-ensemble de [${[...SERVICES_OK].join(", ")}] (souvent vide en pleine nature), "ambiance": une phrase sensorielle}.`,
                `Cohérent avec l'univers Naruto. Pas de personnages canon nommés. Réponds SEULEMENT le JSON.`,
            ].join("\n");
            const txt = await evoAI.callHF(evoAI.MODEL, [{ role: "system", content: sys }, { role: "user", content: user }]);
            const j = extractJSON(txt);
            if (j && j.nom) {
                const nom = String(j.nom).slice(0, 40);
                return {
                    id: slug(nom), nom,
                    type: TYPES.includes(j.type) ? j.type : rng.pick(TYPES),
                    description: String(j.description || "").slice(0, 400),
                    ambiance: String(j.ambiance || "").slice(0, 200),
                    danger: clampDanger(j.danger),
                    services: sanitizeServices(j.services),
                    genere: true, ia: true,
                };
            }
        } catch (e) { console.error("⚠️ worldgen IA:", e.response?.data?.error || e.message); }
    }

    // Repli local (sans IA) : le monde s'étend quand même.
    const nom = rng.pick(NOMS_LIEUX);
    return {
        id: slug(nom), nom,
        type: rng.pick(TYPES),
        description: `Un lieu sauvage et méconnu s'étend devant toi, à l'écart des routes fréquentées.`,
        ambiance: "Le vent porte des odeurs de terre humide et de résine.",
        danger: rng.int(1, 4),
        services: rng.chance(0.2) ? ["repos"] : [],
        genere: true, ia: false,
    };
}

module.exports = { generateLocation };
