// Base des descriptions détaillées pour chaque commande, utilisée par !aide.
// Clé = nom de la commande (sans le "!"), valeur = { usage, description, exemple, adminOnly, category }
const AIDE = {
    menu: {
        usage: "!menu",
        description: "Affiche le menu principal avec toutes les catégories de commandes.",
        exemple: "!menu",
        category: "general"
    },
    aide: {
        usage: "!aide <commande>",
        description: "Affiche le détail d'une commande précise : à quoi elle sert, comment l'utiliser, et un exemple.",
        exemple: "!aide tirage",
        category: "general"
    },

    // --- Combat RP ---
    combat: {
        usage: "!combat",
        description: "Ouvre une arène de combat dans le chat. Les joueurs envoient ensuite leurs pavés de combat librement, puis on utilise !verdict pour les comparer.",
        exemple: "!combat",
        category: "combat"
    },
    verdict: {
        usage: "!verdict PAVÉ1 vs PAVÉ2",
        description: "Analyse deux textes de combat (séparés par \"vs\") et désigne un vainqueur selon des mots-clés d'attaque, de défense, de vitesse et de puissance.",
        exemple: "!verdict Naruto charge avec un Rasengan vs Sasuke esquive et riposte avec un Chidori",
        category: "combat"
    },
    stopfight: {
        usage: "!stopfight",
        description: "Annule le combat actuellement ouvert dans ce chat.",
        exemple: "!stopfight",
        category: "combat"
    },
    win: {
        usage: "!win <pseudo>",
        description: "(Admin) Enregistre une victoire pour le joueur indiqué : +1 victoire, +3 points, +50 000 de bourse.",
        exemple: "!win paul",
        adminOnly: true,
        category: "combat"
    },
    lose: {
        usage: "!lose <pseudo>",
        description: "(Admin) Enregistre une défaite pour le joueur indiqué : +1 défaite, +10 000 de bourse (compensation).",
        exemple: "!lose paul",
        adminOnly: true,
        category: "combat"
    },

    // --- Duel ---
    duel: {
        usage: "!duel debut @j1 vs @j2  |  !duel off winner: @joueur",
        description: "Lance ou termine un duel officiel entre deux joueurs mentionnés. Le duel terminé est ajouté à l'historique.",
        exemple: "!duel debut @paul vs @marie",
        category: "duel"
    },
    historique: {
        usage: "!historique",
        description: "Affiche les 10 derniers duels enregistrés dans l'historique global.",
        exemple: "!historique",
        category: "duel"
    },

    // --- Chrono ---
    timer: {
        usage: "!timer <minutes>",
        description: "Lance un chronomètre personnalisé, entre 1 et 60 minutes. Une alerte est envoyée à la fin.",
        exemple: "!timer 5",
        category: "chrono"
    },
    latence: {
        usage: "!latence",
        description: "Lance un chronomètre fixe de 7 minutes.",
        exemple: "!latence",
        category: "chrono"
    },
    pause: {
        usage: "!pause",
        description: "Met en pause le chronomètre en cours dans ce chat, en conservant le temps restant.",
        exemple: "!pause",
        category: "chrono"
    },
    go: {
        usage: "!go",
        description: "Reprend un chronomètre précédemment mis en pause.",
        exemple: "!go",
        category: "chrono"
    },
    stop: {
        usage: "!stop",
        description: "Arrête complètement le chronomètre en cours (actif ou en pause).",
        exemple: "!stop",
        category: "chrono"
    },

    // --- Joueurs ---
    new: {
        usage: "!new <pseudo>",
        description: "Crée une nouvelle fiche joueur avec ce pseudo. Le pseudo doit être unique.",
        exemple: "!new Paul",
        category: "joueurs"
    },
    fiche: {
        usage: "!fiche <pseudo>",
        description: "Affiche la fiche complète d'un joueur : division, bourse, stars, victoires/défaites, points et rang.",
        exemple: "!fiche paul",
        category: "joueurs"
    },
    classement: {
        usage: "!classement",
        description: "Affiche le top 10 des joueurs classés par points.",
        exemple: "!classement",
        category: "joueurs"
    },
    rang: {
        usage: "!rang <pseudo>",
        description: "Affiche le rang précis d'un joueur dans le classement général, avec ses stats clés.",
        exemple: "!rang paul",
        category: "joueurs"
    },

    // --- Cartes ---
    tirage: {
        usage: "!tirage c/b/a/s/random",
        description: "Tire une carte au hasard selon la rareté choisie (C = Commun, B = Rare, A = Épique, S = Légendaire) ou totalement aléatoire.",
        exemple: "!tirage s",
        category: "cartes"
    },
    carte: {
        usage: "!carte <nom>",
        description: "Recherche et affiche la fiche détaillée d'une carte précise par son nom (recherche partielle acceptée).",
        exemple: "!carte Naruto Uzumaki",
        category: "cartes"
    },
    boutique: {
        usage: "!boutique",
        description: "Affiche toutes les cartes disponibles, regroupées par rareté, avec leur prix.",
        exemple: "!boutique",
        category: "cartes"
    },
    rules: {
        usage: "!rules",
        description: "Affiche les règles du bot/RP, sous forme d'images.",
        exemple: "!rules",
        category: "cartes"
    },

    // --- Casino ---
    casino: {
        usage: "!casino",
        description: "Affiche la liste complète des jeux de casino disponibles, avec leurs multiplicateurs de gain.",
        exemple: "!casino",
        category: "casino"
    },
    pof: {
        usage: "!pof <pile/face> <pseudo> <mise>",
        description: "Pile ou face. Tu choisis toi-même ta mise — le bot vérifie qu'elle ne dépasse pas ta bourse avant d'accepter. Gain x2 en cas de bonne réponse.",
        exemple: "!pof pile paul 2000",
        category: "casino"
    },
    machine: {
        usage: "!machine <pseudo> <mise>",
        description: "Machine à sous à 3 symboles. Tu choisis toi-même ta mise. Paire = x2, triple identique = x5, triple 💎 = jackpot x10.",
        exemple: "!machine paul 5000",
        category: "casino"
    },
    des: {
        usage: "!des <plus/moins/exact> <pseudo> <mise>",
        description: "Jeu de dés (2 dés à 6 faces). Tu choisis toi-même ta mise. Pari sur une somme > 7 (x1.8), < 7 (x1.8), ou exactement 7 (x4, plus rare).",
        exemple: "!des plus paul 3000",
        category: "casino"
    },
    roulette: {
        usage: "!roulette <rouge/noir/vert> <pseudo> <mise>",
        description: "Roulette à 37 cases (style européenne). Tu choisis toi-même ta mise. Rouge/noir paient x2, le vert (rare, 1 case sur 37) paie x14.",
        exemple: "!roulette rouge paul 4000",
        category: "casino"
    },
    hl: {
        usage: "!hl <plus/moins> <pseudo> <mise>",
        description: "Higher/Lower : une carte est tirée, puis une seconde. Parie si la seconde sera plus haute ou plus basse que la première. Tu choisis toi-même ta mise. Gain x1.8.",
        exemple: "!hl plus paul 2500",
        category: "casino"
    },

    // --- Admin ---
    delete: {
        usage: "!delete <pseudo>",
        description: "(Admin) Supprime définitivement la fiche d'un joueur.",
        exemple: "!delete paul",
        adminOnly: true,
        category: "admin"
    },
    addmoney: {
        usage: "!addmoney <pseudo> <montant>",
        description: "(Admin) Ajoute une somme à la bourse d'un joueur.",
        exemple: "!addmoney paul 50000",
        adminOnly: true,
        category: "admin"
    },
    addstars: {
        usage: "!addstars <pseudo> <montant>",
        description: "(Admin) Ajoute des stars à un joueur.",
        exemple: "!addstars paul 5",
        adminOnly: true,
        category: "admin"
    },
    setstats: {
        usage: "!setstats <pseudo> <argent|stars> <valeur>",
        description: "(Admin) Fixe directement la bourse ou les stars d'un joueur à une valeur précise (remplace l'ancienne valeur).",
        exemple: "!setstats paul argent 50000",
        adminOnly: true,
        category: "admin"
    },
    reset: {
        usage: "!reset <pseudo>",
        description: "(Admin) Remet à zéro toutes les statistiques d'un joueur (bourse, stars, victoires, défaites, points), en gardant son pseudo.",
        exemple: "!reset paul",
        adminOnly: true,
        category: "admin"
    },
};

// Image associée à chaque catégorie, affichée avec la réponse de !aide <commande>.
// "general" n'a pas d'image dédiée (pas reçue) ; les catégories sans image
// listées ici retombent simplement sur un message texte sans visuel.
const CATEGORY_IMAGES = {
    combat: "https://files.catbox.moe/jchbi8.jpg",
    cartes: "https://files.catbox.moe/jchbi8.jpg",
    casino: "https://files.catbox.moe/04bcjy.jpg", // réutilise l'image de !casino
    // duel, chrono, joueurs, admin : pas d'image fournie pour l'instant
};

module.exports = {
    command: "!aide",
    AIDE,

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        let query = text.replace("!aide", "").trim().toLowerCase();
        // Tolère qu'on tape "!aide !tirage" avec le point d'exclamation
        if (query.startsWith("!")) query = query.slice(1);

        if (!query) {
            const liste = Object.keys(AIDE).map(c => `!${c}`).join(", ");
            return sock.sendMessage(from, {
                text:
`❓ *AIDE — EGO BOT*

Tape *!aide <commande>* pour obtenir le détail d'une commande précise.

📋 Commandes disponibles :
${liste}

_Exemple : !aide tirage_`
            });
        }

        const entry = AIDE[query];

        if (!entry) {
            return sock.sendMessage(from, {
                text: `❌ Commande *!${query}* introuvable.\n\nTape *!aide* sans argument pour voir la liste complète.`
            });
        }

        const text2 =
`❓ *AIDE — !${query}*${entry.adminOnly ? " 🛡️ (admin)" : ""}

📌 *Utilisation* :
${entry.usage}

📝 *Description* :
${entry.description}

💡 *Exemple* :
${entry.exemple}`;

        const fullText = text2 + `\n\n_Demandé par @${senderNumber}_`;
        const imageUrl = CATEGORY_IMAGES[entry.category];

        if (imageUrl) {
            await sock.sendMessage(from, {
                image: { url: imageUrl },
                caption: fullText,
                mentions: [senderJid]
            });
        } else {
            await sock.sendMessage(from, {
                text: fullText,
                mentions: [senderJid]
            });
        }
    }
};
