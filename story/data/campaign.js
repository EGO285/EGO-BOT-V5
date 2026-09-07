// ============================================================
//  story/data/campaign.js
//  HISTOIRE PRINCIPALE (canon) — de l'ère Naruto enfant à Boruto: Two Blue Vortex.
//  Chaque chapitre : { arc, titre, type: "scene"|"combat", texte, ennemi?, recompense }
//  Ton OC VIT ces événements à sa manière (canon + actions du joueur).
//  Contenu = données pures : on peut en ajouter sans toucher au moteur.
// ============================================================
const CHAPTERS = [
  // ---- ARC ACADÉMIE ----
  { arc: "Académie", titre: "La rentrée à l'Académie", type: "scene", recompense: { xp: 150, ryo: 100 },
    texte: "Konoha s'éveille. Aux côtés d'un garçon turbulent nommé Naruto et d'un Uchiha silencieux, ton personnage fait ses premiers pas de shinobi à l'Académie. Iruka-sensei observe la nouvelle promotion." },
  { arc: "Académie", titre: "La trahison de Mizuki", type: "combat", ennemi: "mizuki", recompense: { xp: 400, ryo: 500 },
    texte: "La nuit du vol du Rouleau des Sceaux. Mizuki révèle sa traîtrise et t'attaque pour s'emparer du parchemin interdit. Iruka est blessé — à toi de jouer." },

  // ---- ARC GENIN ----
  { arc: "Genin", titre: "Formation des équipes", type: "scene", recompense: { xp: 200, ryo: 150 },
    texte: "Diplômé ! Les équipes de trois sont formées et les jōnin-sensei récupèrent leurs élèves. Ton aventure de vrai shinobi commence." },
  { arc: "Genin", titre: "Le test des clochettes", type: "combat", ennemi: "chef_bandits", recompense: { xp: 500, ryo: 600 },
    texte: "Ton sensei te soumet à une épreuve : lui prendre une clochette avant midi. Il faut ruse et travail d'équipe. (Adversaire d'entraînement de rang élevé)" },

  // ---- ARC PAYS DES VAGUES ----
  { arc: "Pays des Vagues", titre: "Le pont de Tazuna", type: "scene", recompense: { xp: 300, ryo: 200 },
    texte: "Première mission hors du village : escorter le constructeur Tazuna au Pays des Vagues, sous la coupe du cruel Gatō. La brume se lève, menaçante." },
  { arc: "Pays des Vagues", titre: "Zabuza, le Démon de la Brume", type: "combat", ennemi: "zabuza", recompense: { xp: 1500, ryo: 2000 },
    texte: "Zabuza Momochi surgit de la brume, son sabre géant fendant l'air. Un déserteur de rang A vous barre la route." },
  { arc: "Pays des Vagues", titre: "Les miroirs de Haku", type: "combat", ennemi: "haku", recompense: { xp: 1800, ryo: 2200 },
    texte: "Piégé dans le Dôme des Miroirs de Glace, tu affrontes Haku, dont la vitesse défie l'œil. Le froid mord ta peau." },

  // ---- ARC EXAMEN CHŪNIN ----
  { arc: "Examen Chūnin", titre: "La Forêt de la Mort", type: "scene", recompense: { xp: 400, ryo: 300 },
    texte: "L'examen Chūnin commence. Dans la Forêt de la Mort, chaque équipe chasse les rouleaux des autres. Une présence glaçante rôde entre les arbres..." },
  { arc: "Examen Chūnin", titre: "Gaara du Désert", type: "combat", ennemi: "gaara", recompense: { xp: 3000, ryo: 3500 },
    texte: "Le sable de Gaara écrase tout sur son passage. Le jinchūriki du Shukaku te toise, assoiffé de sang." },
  { arc: "Konoha Crush", titre: "L'invasion de Konoha", type: "combat", ennemi: "orochimaru", recompense: { xp: 5000, ryo: 6000 },
    texte: "Orochimaru déclenche son attaque sur Konoha en plein examen. Le Sannin serpent se dresse devant toi, sourire venimeux aux lèvres." },

  // ---- FIN NARUTO CLASSIQUE ----
  { arc: "Recherche", titre: "Le départ de Sasuke", type: "scene", recompense: { xp: 800, ryo: 500 },
    texte: "Sasuke a choisi la voie de la vengeance et quitte le village pour Orochimaru. Naruto jure de le ramener. Une page se tourne." },

  // ---- SHIPPŪDEN ----
  { arc: "Shippūden", titre: "Le retour", type: "scene", recompense: { xp: 1000, ryo: 700 },
    texte: "Deux ans et demi ont passé. Tu reviens à Konoha plus fort, aguerri. Mais l'Akatsuki, ces nuages rouges, se met en marche." },
  { arc: "Shippūden", titre: "Sauvetage du Kazekage", type: "combat", ennemi: "deidara", recompense: { xp: 4500, ryo: 5000 },
    texte: "L'Akatsuki a enlevé Gaara. Deidara et son art explosif vous barrent la route dans le désert de Suna." },
  { arc: "Shippūden", titre: "Le cœur immortel", type: "combat", ennemi: "kakuzu", recompense: { xp: 5500, ryo: 6000 },
    texte: "Kakuzu et ses cinq cœurs élémentaires semblent invincibles. Il faut viser juste pour l'abattre définitivement." },
  { arc: "Shippūden", titre: "Itachi Uchiha", type: "combat", ennemi: "itachi", recompense: { xp: 7000, ryo: 8000 },
    texte: "Face au génie du Mangekyō Sharingan, la réalité elle-même vacille. Ne croise pas son regard sans préparation." },
  { arc: "Shippūden", titre: "La Douleur de Pain", type: "combat", ennemi: "pain", recompense: { xp: 9000, ryo: 10000 },
    texte: "Pain rase Konoha d'un « Shinra Tensei ». Les six corps du Rinnegan convergent vers toi. Le sort du village est en jeu." },

  // ---- GRANDE GUERRE NINJA ----
  { arc: "Grande Guerre", titre: "La Quatrième Grande Guerre Ninja", type: "scene", recompense: { xp: 2000, ryo: 1000 },
    texte: "Les cinq nations s'unissent enfin sous l'Alliance Shinobi. Face à l'armée de l'Akatsuki et aux morts ressuscités, la plus grande guerre du monde ninja éclate." },
  { arc: "Grande Guerre", titre: "Obito, le Jinchūriki des Dix Queues", type: "combat", ennemi: "obito", recompense: { xp: 14000, ryo: 15000 },
    texte: "Obito devient l'hôte du Jūbi, drapé de boules-vérité. Sa puissance dépasse l'entendement." },
  { arc: "Grande Guerre", titre: "Madara Uchiha ressuscité", type: "combat", ennemi: "madara", recompense: { xp: 20000, ryo: 22000 },
    texte: "Madara, au sommet de sa puissance, invoque un Susanoo parfait et fait pleuvoir des météores. La légende en personne." },
  { arc: "Grande Guerre", titre: "Kaguya Ōtsutsuki", type: "combat", ennemi: "kaguya", recompense: { xp: 35000, ryo: 40000 },
    texte: "L'origine du chakra se révèle : Kaguya la Déesse Lapin déforme les dimensions elles-mêmes. Le combat ultime de l'ère Naruto." },

  // ---- THE LAST ----
  { arc: "The Last", titre: "La menace de la Lune", type: "combat", ennemi: "toneri", recompense: { xp: 26000, ryo: 28000 },
    texte: "Des années plus tard, Toneri Ōtsutsuki fait chuter la Lune sur la Terre pour un dessein funeste. Le Tenseigan brille dans la nuit." },

  // ---- ÈRE BORUTO ----
  { arc: "Boruto", titre: "L'examen d'une nouvelle génération", type: "scene", recompense: { xp: 4000, ryo: 2000 },
    texte: "Une nouvelle génération grandit à Konoha modernisée. Boruto, Sarada et Mitsuki font leurs preuves. Mais un danger venu des étoiles approche." },
  { arc: "Boruto", titre: "Momoshiki Ōtsutsuki", type: "combat", ennemi: "momoshiki", recompense: { xp: 40000, ryo: 45000 },
    texte: "Momoshiki dévore le chakra et déchaîne des Rasengan colossaux. Le Karma s'éveille." },
  { arc: "Kara", titre: "Isshiki Ōtsutsuki", type: "combat", ennemi: "isshiki", recompense: { xp: 60000, ryo: 65000 },
    texte: "Isshiki plie la taille des choses à sa volonté, ses cubes noirs quadrillant le champ de bataille. L'organisation Kara touche à son but." },

  // ---- TWO BLUE VORTEX ----
  { arc: "Two Blue Vortex", titre: "Le tourbillon bleu", type: "combat", ennemi: "code", recompense: { xp: 90000, ryo: 100000 },
    texte: "Le monde a oublié Boruto. Code déchaîne ses limiteurs et lâche ses Divins Arbres. Dans ce nouveau chapitre, ton personnage devient une légende parmi les légendes." },
  { arc: "Two Blue Vortex", titre: "Légende vivante", type: "scene", recompense: { xp: 20000, ryo: 20000 },
    texte: "De l'Académie jusqu'au tourbillon bleu, ton nom résonne désormais dans toutes les nations. Ton histoire ne fait, au fond, que commencer... et le monde continue de tourner." },
];

module.exports = { CHAPTERS };
