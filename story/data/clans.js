// Clans jouables (canon + possibilité OC). Bonus appliqués à la création.
const CLANS = {
    "sans-clan": { nom: "Sans clan", bonus: {}, affinite: null, kg: null, desc: "Un ninja sans lignée particulière, libre de tout tracer." },
    uchiha:   { nom: "Uchiha",   bonus: { ninjutsu: 3, genjutsu: 2, perception: 2 }, affinite: "katon", kg: "sharingan", desc: "Clan du Sharingan, maîtres du feu et des illusions." },
    hyuga:    { nom: "Hyūga",    bonus: { taijutsu: 4, perception: 3, controleChakra: 2 }, affinite: null, kg: "byakugan", desc: "Clan du Byakugan et du Poing Souple." },
    senju:    { nom: "Senju",    bonus: { pvMax: 20, endurance: 3, volonte: 2 }, affinite: "suiton", kg: null, desc: "Clan de la forêt, vitalité et polyvalence légendaires." },
    uzumaki:  { nom: "Uzumaki",  bonus: { pvMax: 30, chakraMax: 30, resistance: 3 }, affinite: "fuuton", kg: null, desc: "Immense réserve de chakra et arts du scellement." },
    nara:     { nom: "Nara",     bonus: { intelligence: 4, controleChakra: 2 }, affinite: "yin", kg: "ombre", desc: "Génies tacticiens, manipulation des ombres." },
    akimichi: { nom: "Akimichi", bonus: { force: 4, pvMax: 20, endurance: 3 }, affinite: "yang", kg: "expansion", desc: "Force brute et techniques d'expansion corporelle." },
    yamanaka: { nom: "Yamanaka", bonus: { intelligence: 3, perception: 3, volonte: 2 }, affinite: "yin", kg: "esprit", desc: "Techniques mentales et sensorielles." },
    aburame:  { nom: "Aburame",  bonus: { perception: 3, furtivite: 3, controleChakra: 2 }, affinite: null, kg: "insectes", desc: "Symbiose avec les insectes destructeurs de chakra." },
    inuzuka:  { nom: "Inuzuka",  bonus: { vitesse: 3, taijutsu: 3, perception: 2 }, affinite: null, kg: "canin", desc: "Combat en symbiose avec un compagnon canin." },
    hatake:   { nom: "Hatake",   bonus: { vitesse: 3, reflexes: 3, ninjutsu: 2 }, affinite: "raiton", kg: null, desc: "Lignée rare, prodiges du combat." },
    sarutobi: { nom: "Sarutobi", bonus: { ninjutsu: 3, volonte: 3, chakraMax: 15 }, affinite: "katon", kg: null, desc: "Clan de la Volonté du Feu, proche des Hokage." },
};
module.exports = { CLANS };
