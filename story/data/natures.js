// Natures de chakra + Yin/Yang. Compatibilités simples (affinité de départ selon clan/aléatoire).
const NATURES = {
    katon:  { nom: "Katon (Feu)",    fort: "fuuton", faible: "suiton" },
    fuuton: { nom: "Fūton (Vent)",   fort: "raiton", faible: "katon" },
    raiton: { nom: "Raiton (Foudre)",fort: "doton",  faible: "fuuton" },
    doton:  { nom: "Doton (Terre)",  fort: "suiton", faible: "raiton" },
    suiton: { nom: "Suiton (Eau)",   fort: "katon",  faible: "doton" },
    yin:    { nom: "Yin", fort: null, faible: null },
    yang:   { nom: "Yang", fort: null, faible: null },
    yinyang:{ nom: "Yin-Yang", fort: null, faible: null },
};
// Renvoie un multiplicateur d'avantage élémentaire attaquant->défenseur.
function natureMultiplier(att, def) {
    if (!att || !def) return 1;
    const a = NATURES[att];
    if (!a) return 1;
    if (a.fort === def) return 1.25;
    if (a.faible === def) return 0.8;
    return 1;
}
module.exports = { NATURES, natureMultiplier };
