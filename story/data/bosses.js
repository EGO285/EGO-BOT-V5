// Boss avec phases, techniques, faiblesses. Le moteur gère les chiffres.
const BOSSES = {
  voyou: { nom: "Voyou de grand chemin", niveau: 4, rang: "D", pv: 45, chakra: 20,
    stats: { taijutsu: 4, ninjutsu: 2, vitesse: 4, reflexes: 3, precision: 4, resistance: 2, force: 4 },
    faiblesse: null, techniques: [], phases: 1, butin: { ryo: 200, xp: 120, items: [] },
    desc: "Un brigand mal dégrossi qui détrousse les voyageurs." },
  loup: { nom: "Loup des forêts", niveau: 3, rang: "D", pv: 40, chakra: 0,
    stats: { taijutsu: 4, ninjutsu: 0, vitesse: 6, reflexes: 5, precision: 5, resistance: 2, force: 4 },
    faiblesse: "katon", techniques: [], phases: 1, butin: { ryo: 80, xp: 90, items: [] },
    desc: "Un loup affamé, rapide et hargneux." },
  chef_bandits: { nom: "Gōza, chef des bandits", niveau: 10, rang: "C", pv: 140, chakra: 60,
    stats: { taijutsu: 10, ninjutsu: 6, vitesse: 7, reflexes: 6, precision: 7, resistance: 5, force: 10 },
    faiblesse: "raiton", techniques: ["shuriken"], phases: 1, butin: { ryo: 800, xp: 300, items: ["potion_soin"] },
    desc: "Une brute massive qui terrorise la route du Feu." },
  zabuza: { nom: "Zabuza Momochi", niveau: 40, rang: "A", pv: 520, chakra: 220,
    stats: { taijutsu: 30, ninjutsu: 34, vitesse: 26, reflexes: 26, precision: 24, resistance: 22, force: 24 }, affinite: "suiton",
    faiblesse: "raiton", techniques: ["suiton_teppodama"], phases: 2, butin: { ryo: 5000, xp: 2500, items: ["parchemin_scellement"] },
    desc: "Le Démon de Kiri, maître de la brume et du sabre." },
};
module.exports = { BOSSES };
