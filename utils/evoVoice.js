// ============================================================
//  utils/evoVoice.js
//  Couche "personnalité IA" de E.V.O (EGO VIRTUAL OPERATOR).
//
//  Objectif : donner à E.V.O un ton d'assistant IA vivant, avec des
//  phrases DIFFÉRENTES à chaque interaction (aucune réponse figée),
//  toujours en rapport avec le contexte de l'interaction.
//
//  Chaque "pool" est un tableau de formulations interchangeables.
//  pick() en choisit une au hasard. Les fonctions de haut niveau
//  (evoUnknownCommand, evoThinking, evoChat...) assemblent une réponse
//  contextualisée à partir de ces pools.
// ============================================================

const IDENTITE = "E.V.O";
const IDENTITE_LONG = "EGO VIRTUAL OPERATOR";
const CREATEUR = "ego";

// Choisit un élément au hasard dans un tableau.
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Choisit n éléments distincts au hasard.
function pickMany(arr, n) {
    const copie = [...arr];
    const out = [];
    while (out.length < n && copie.length) {
        out.push(copie.splice(Math.floor(Math.random() * copie.length), 1)[0]);
    }
    return out;
}

// ──────────────────────────────────────────────
//  POOLS DE PHRASES
// ──────────────────────────────────────────────

// Petites intros "je réfléchis / je traite ta demande"
const THINKING = [
    "Je traite ça",
    "Analyse en cours",
    "Deux secondes, je regarde",
    "Je m'en occupe",
    "Requête reçue, je calcule",
    "Ok, je m'aligne là-dessus",
    "Je lance le traitement",
    "C'est parti, je compile la réponse",
];

// Confirmations de succès (préfixes)
const SUCCES = [
    "C'est fait",
    "Voilà pour toi",
    "Opération réussie",
    "Terminé",
    "Et voilà",
    "Nickel, c'est bon",
    "Tout roule",
    "Mission accomplie",
];

// Ouvertures quand la commande n'existe pas / mal écrite
const CONFUS = [
    "Hmm, je capte pas cette commande",
    "Cette instruction m'est inconnue",
    "Je trouve rien qui corresponde exactement",
    "Alors ça, ça me parle pas",
    "Aucune commande ne matche vraiment",
    "Je reconnais pas cette entrée",
    "Bizarre, j'ai rien qui colle à ça",
];

// Tournures "vouliez-vous dire ... ?" (le %s est remplacé par la commande)
const SUGGESTION = [
    "tu voulais pas écrire *%s* à tout hasard ?",
    "tu cherchais peut-être *%s* ?",
    "c'était pas *%s* que tu voulais taper ?",
    "je parie sur *%s*, non ?",
    "tu visais sûrement *%s*, je me trompe ?",
    "à mon avis c'était *%s*.",
    "genre *%s* ? Ça te dit quelque chose ?",
];

// Quand aucune suggestion proche n'est trouvée
const AUCUNE_IDEE = [
    "Tape *!menu* pour voir tout ce que je sais faire.",
    "Fais *!menu*, je te montre mes capacités.",
    "Un petit *!aide* et je te guide.",
    "Balance *!menu*, on repart sur de bonnes bases.",
    "Essaie *!menu*, tout y est listé.",
];

// Salutations (réponses au bonjour de l'utilisateur)
const SALUTATIONS = [
    "Hey, ravi de te lire. Qu'est-ce qu'on fait aujourd'hui ?",
    "Salut à toi. Je suis opérationnel, dis-moi tout.",
    "Yo. E.V.O en ligne, prêt à bosser.",
    "Bonjour ! Systèmes chauds, je t'écoute.",
    "Coucou. Balance ta demande, je gère.",
    "Salut chef, par quoi on commence ?",
];

// Réponses à "ça va / comment tu vas"
const HUMEUR = [
    "Tourne à plein régime, merci. Et toi, quel est le programme ?",
    "Zéro latence, zéro bug, la forme quoi. Toi ?",
    "Impeccable, mes circuits ronronnent. Qu'est-ce qu'il te faut ?",
    "Au top. Je suis là pour t'être utile, vas-y.",
    "Stable et dispo à 100%. Dis-moi comment je t'aide.",
];

// Réponses aux remerciements
const MERCI = [
    "Avec plaisir, c'est mon taf.",
    "Quand tu veux, je suis fait pour ça.",
    "De rien, reviens quand tu as besoin.",
    "Toujours là pour toi.",
    "Pas de souci, c'est cadeau.",
];

// Réponses "au revoir"
const ADIEUX = [
    "À plus, je reste allumé si tu reviens.",
    "Ciao. Je me mets en veille, appelle-moi quand tu veux.",
    "Bonne route, je garde la ligne ouverte.",
    "À bientôt, E.V.O ne dort jamais vraiment.",
];

// Réponses génériques quand E.V.O ne "comprend" pas le message en langage naturel
const CHAT_GENERIQUE = [
    "Intéressant. Je suis surtout calibré pour les commandes du serveur — tape *!menu* pour voir mon terrain de jeu.",
    "Je t'entends. Pour l'instant je brille surtout sur les commandes RP, casino et gestion : *!menu* pour la liste.",
    "Note prise. Si tu veux du concret, lance une commande — *!aide* te montre comment.",
    "Reçu. Je réponds mieux quand tu me donnes une commande précise : *!menu*.",
    "Ok. Je reformule en action si tu me donnes une commande — regarde *!menu*.",
];

// Questions sur l'identité
const QUI = [
    `Je suis *${IDENTITE}* — ${IDENTITE_LONG} — un assistant conçu par *${CREATEUR}* pour faire tourner ce serveur.`,
    `${IDENTITE}, pour te servir. ${IDENTITE_LONG}, né des mains d'*${CREATEUR}*.`,
    `On m'appelle *${IDENTITE}*. Mon créateur, c'est *${CREATEUR}*, et ma mission c'est toi.`,
];

// Petites signatures de fin, variées
const SIGNATURES = [
    `— ${IDENTITE}`,
    `⚡ ${IDENTITE}`,
    `🤖 ${IDENTITE} · ${IDENTITE_LONG}`,
    `— ${IDENTITE}, à ton service`,
    `⟡ ${IDENTITE}`,
];

// ──────────────────────────────────────────────
//  FONCTIONS DE HAUT NIVEAU
// ──────────────────────────────────────────────

// Message quand une commande "!xxx" ne correspond à rien, avec ou sans suggestion.
function evoUnknownCommand(tape, suggestion) {
    const intro = pick(CONFUS);
    if (suggestion) {
        const corps = pick(SUGGESTION).replace("%s", suggestion);
        return `🤔 ${intro}. ${cap(corps)}\n\n${pick(SIGNATURES)}`;
    }
    return `🤖 ${intro}. ${pick(AUCUNE_IDEE)}\n\n${pick(SIGNATURES)}`;
}

// Réponse conversationnelle "IA" en fonction du texte libre reçu (après !evo).
function evoChat(message) {
    const t = (message || "").toLowerCase().trim();

    if (!t) {
        return `${pick(["Je t'écoute", "Vas-y, balance", "Dis-moi tout", "Je suis tout ouïe"])}. Écris *!evo <ton message>* et je te réponds.\n\n${pick(SIGNATURES)}`;
    }

    let corps;
    if (/\b(bonjour|salut|coucou|yo|hello|bonsoir|hey|wesh)\b/.test(t)) {
        corps = pick(SALUTATIONS);
    } else if (/(ça va|ca va|comment tu vas|comment vas|la forme|tu vas bien)/.test(t)) {
        corps = pick(HUMEUR);
    } else if (/(merci|thanks|thx|gracias)/.test(t)) {
        corps = pick(MERCI);
    } else if (/(au revoir|bye|ciao|à plus|a plus|bonne nuit|adieu)/.test(t)) {
        corps = pick(ADIEUX);
    } else if (/(qui es[- ]tu|qui est tu|c'est quoi ton nom|ton nom|t'es qui|tu es qui|présente|presente)/.test(t)) {
        corps = pick(QUI);
    } else if (/(que sais[- ]tu faire|tu sais faire quoi|tes capacités|tes fonctions|aide|help)/.test(t)) {
        corps = "Je gère les fiches joueurs, le casino, la banque RP, la gestion de groupe et plein de commandes fun. Tape *!menu* pour tout voir, ou *!aide <commande>* pour un détail.";
    } else if (t.endsWith("?")) {
        corps = pick([
            "Bonne question. Je suis surtout un assistant d'action : donne-moi une commande et je l'exécute.",
            "Je réfléchis mieux en commandes qu'en philosophie. Essaie *!menu* pour voir ce que je sais résoudre.",
            "Hmm. Pour te répondre utilement il me faudrait une commande précise — *!aide* est ton ami.",
        ]);
    } else {
        corps = pick(CHAT_GENERIQUE);
    }

    return `${corps}\n\n${pick(SIGNATURES)}`;
}

// Met une majuscule à la première lettre.
function cap(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

module.exports = {
    IDENTITE,
    IDENTITE_LONG,
    CREATEUR,
    pick,
    pickMany,
    cap,
    evoUnknownCommand,
    evoChat,
    THINKING,
    SUCCES,
    SIGNATURES,
    SALUTATIONS,
};
