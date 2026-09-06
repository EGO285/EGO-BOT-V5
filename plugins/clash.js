const { pick } = require("../utils/evoVoice");

// Clashs "bon esprit" pour rire — 7 curatés + un large pool généré (300+).
const CURATED = [
    "ton ping est plus élevé que ton QI, et pourtant tu lag.",
    "même une calculatrice cassée compte mieux que toi.",
    "t'es la preuve vivante qu'on peut respirer sans réfléchir.",
    "ton style est tellement daté qu'il buffer.",
    "tu joues au casino comme tu gères ta vie : tout en pertes.",
    "on t'a mis en 240p, pour cacher les détails.",
    "t'es pas mauvais, t'es juste... constamment en mode démo.",
];

const OUVERTURES = [
    "frérot,", "écoute,", "sans mentir,", "objectivement,", "je vais être franc,",
    "soyons clairs,", "petite info,", "spoiler,", "franchement,", "entre nous,",
    "avec tout le respect que je te dois pas,", "note bien ça,", "tiens,", "au fait,", "bref,",
];

const PIQUES = [
    "ton cerveau est en mode économie d'énergie depuis ta naissance.",
    "t'as le charisme d'un mur de chargement bloqué à 99%.",
    "ton niveau au RP, c'est un tuto qu'on skip.",
    "même ton reflet évite de croiser ton regard.",
    "t'es le seul bug que personne n'a envie de corriger.",
    "tu tapes des combos comme d'autres tapent des fautes.",
    "ta stratégie tient sur un post-it à moitié effacé.",
    "t'as le sens du timing d'un réveil déchargé.",
    "ton inventaire est vide, comme tes arguments.",
    "tu perds au pile ou face... contre toi-même.",
    "ton personnage a plus de défaites que de pixels.",
    "t'es tellement lent que le boost te double à l'arrêt.",
    "ta hitbox de talent, on la cherche encore.",
    "tu confonds 'esquive' et 'prendre le coup avec style'.",
    "ton IC (instinct de combat) détecte surtout la défaite.",
    "t'as un cooldown permanent sur la bonne idée.",
    "ta bourse pleure à chaque fois que tu ouvres le casino.",
    "t'es le genre à rater un !daily.",
    "ton chakra sert surtout à alimenter tes excuses.",
    "tu lis les règles comme un CGU : jamais.",
    "ta réactivité est classée L-OMEGA... option lag en plus.",
    "t'as le flair d'un kunai lancé les yeux fermés.",
    "ton meilleur move, c'est quitter le combat.",
    "t'es aussi imprévisible qu'un tuto niveau 1.",
    "ton pavé RP, même le bot fait semblant de l'avoir lu.",
    "tu défends ta position comme un mot de passe 'azerty'.",
    "ta vitesse ninja se mesure en heures.",
    "t'as la finesse tactique d'une porte qui claque.",
    "ton skill est en rupture de stock depuis toujours.",
    "tu rates tes permutations avec la bûche encore dans les mains.",
    "ton plan B, c'est le même que ton plan A : perdre.",
    "t'as un talent rare : décevoir en toute constance.",
    "tu brilles surtout par ton absence de résultats.",
    "ton mental est en 2G dans un monde en fibre.",
    "t'esquives les responsabilités mieux que les attaques.",
    "ta win rate a besoin d'un microscope.",
    "tu joues safe... surtout la carte 'défaite garantie'.",
    "ton style de combat, c'est 'improviser puis regretter'.",
    "t'as le sang-froid d'une glace au soleil.",
    "ton arbre de compétences a perdu ses feuilles.",
    "tu fais des combos... de mauvaises décisions.",
    "t'as la précision d'un GPS hors ligne.",
    "ton aura de champion, c'est surtout du wifi faible.",
];

// Construit le pool complet : curatés + 300+ combinaisons uniques.
function buildPool() {
    const set = new Set(CURATED);
    for (const o of OUVERTURES) {
        for (const p of PIQUES) {
            set.add(`${o} ${p}`);
            if (set.size >= 320) break;
        }
        if (set.size >= 320) break;
    }
    return [...set];
}
const POOL = buildPool();

module.exports = {
    command: "!clash",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const arg = text.replace("!clash", "").trim();
        let cible = arg || "toi";
        const mentions = [];
        if (mentioned.length) { cible = `@${mentioned[0].split("@")[0]}`; mentions.push(mentioned[0]); }
        await sock.sendMessage(from, { text: `🔥 *CLASH* (pour rire 😏)\n\n${cible}, ${pick(POOL)}`, mentions });
    }
};
