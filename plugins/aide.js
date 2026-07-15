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
    collection: {
        usage: "!collection <pseudo>",
        description: "Affiche la liste complète des cartes possédées par un joueur (achetées via !acheter).",
        exemple: "!collection paul",
        category: "joueurs"
    },
    daily: {
        usage: "!daily <pseudo>",
        description: "Réclame une récompense quotidienne (Ryo + Stars). Une seule fois toutes les 24h par joueur.",
        exemple: "!daily paul",
        category: "joueurs"
    },
    logs: {
        usage: "!logs <pseudo>",
        description: "Affiche les 15 dernières transactions d'un joueur (achats, ventes, échanges, daily, actions admin).",
        exemple: "!logs paul",
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
    acheter: {
        usage: "!acheter <nom de la carte> <pseudo>",
        description: "Achète une carte de la boutique. Le bot paie automatiquement avec du Ryo ou des Stars selon ce que le joueur peut se permettre. Si le joueur a des tickets de réduction (-30%), le bot demande confirmation avant de valider (voir !confirmerachat). La carte achetée s'ajoute à l'inventaire visible dans !fiche.",
        exemple: "!acheter Naruto Uzumaki paul",
        category: "cartes"
    },
    confirmerachat: {
        usage: "!confirmerachat <oui|non> <pseudo>",
        description: "Répond à la proposition d'utiliser un ticket de réduction faite par !acheter. 'oui' applique -30% et consomme un ticket, 'non' paye plein tarif. La demande expire après 5 minutes sans réponse.",
        exemple: "!confirmerachat oui paul",
        category: "cartes"
    },
    vendre: {
        usage: "!vendre <nom de la carte> <pseudo>",
        description: "Revend une carte de sa collection contre 50% de son prix d'achat en Ryo.",
        exemple: "!vendre Naruto Uzumaki paul",
        category: "cartes"
    },
    echange: {
        usage: "!echange <pseudo> <pseudo destinataire> <nom de la carte>",
        description: "Propose un échange gratuit d'une carte à un autre joueur. Le destinataire doit confirmer avec !echange accept <pseudo proposant>.",
        exemple: "!echange paul julie Naruto Uzumaki",
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
    blackjack: {
        usage: "!blackjack <pseudo> <mise>",
        description: "Blackjack simplifié contre le bot. Victoire simple x2, Blackjack (21 sur les 2 premières cartes) x2.5.",
        exemple: "!blackjack paul 5000",
        category: "casino"
    },
    craps: {
        usage: "!craps <pseudo> <mise>",
        description: "Variante simplifiée du craps. 7 ou 11 au premier lancer = victoire x2. 2/3/12 = défaite immédiate. Sinon le total devient le 'point' : relances jusqu'à le refaire (x3) ou tomber sur un 7 (défaite).",
        exemple: "!craps paul 3000",
        category: "casino"
    },
    loto: {
        usage: "!loto / !loto acheter <pseudo> / !loto tirer (admin)",
        description: "Loterie collective. Chaque ticket coûte 5000🔶 et alimente une cagnotte commune. Un admin lance le tirage avec !loto tirer : un seul gagnant remporte toute la cagnotte.",
        exemple: "!loto acheter paul",
        category: "casino"
    },
    doubleornothing: {
        usage: "!doubleornothing <pseudo> <mise>",
        description: "Double ou rien. Environ 45% de chance de doubler ta mise (x2), sinon tu perds tout.",
        exemple: "!doubleornothing paul 4000",
        category: "casino"
    },
    devine: {
        usage: "!devine <nombre entre 1 et 20> <pseudo> <mise>",
        description: "Devine un nombre secret tiré entre 1 et 20. Bonne réponse = x20 ta mise !",
        exemple: "!devine 7 paul 1000",
        category: "casino"
    },

    fichephoto: {
        usage: "!fichephoto <pseudo> <url_image>",
        description: "Ajoute ou change l'image associée à la fiche d'un joueur. Marche aussi en réponse à une image jointe.",
        exemple: "!fichephoto paul https://...jpg",
        category: "joueurs"
    },

    // --- Banque ---
    creercompte: {
        usage: "!creercompte <code> <pseudo>",
        description: "Crée ton compte bancaire lié à ta fiche, protégé par un code à 4 chiffres. À utiliser uniquement en PV avec le bot.",
        exemple: "!creercompte 1234 paul",
        category: "banque"
    },
    emprunter: {
        usage: "!emprunter <code> <pseudo> <montant>",
        description: "Emprunte du Ryo à la banque (plafond = 2x ta bourse, intérêt de 10%, remboursement sous 24h). Un seul prêt autorisé par 24h et par compte, même si le précédent est déjà remboursé. En cas de non-remboursement sous 24h : compte suspendu 48h (jeux + achats de cartes bloqués), puis nouveau délai de 24h. Après 3 non-remboursements, le compte est bloqué en permanence jusqu'à ce qu'un admin utilise !unlock. Uniquement en PV.",
        exemple: "!emprunter 1234 paul 20000",
        category: "banque"
    },
    rembourser: {
        usage: "!rembourser <code> <pseudo> <montant>",
        description: "Rembourse partiellement ou totalement ta dette en cours. Impossible pendant une suspension (48h) : il faut attendre la fin de la suspension pour que rembourser soit de nouveau accepté. Uniquement en PV.",
        exemple: "!rembourser 1234 paul 5000",
        category: "banque"
    },
    dette: {
        usage: "!dette <pseudo>",
        description: "Affiche le montant de la dette en cours d'un joueur, sa date d'échéance, et son statut (à jour, suspendu, ou bloqué en permanence).",
        exemple: "!dette paul",
        category: "banque"
    },
    releve: {
        usage: "!releve <pseudo>",
        description: "Affiche l'historique des opérations bancaires (emprunts, remboursements, virements, dépôts, retraits) d'un joueur.",
        exemple: "!releve paul",
        category: "banque"
    },
    virement: {
        usage: "!virement <code> <ton pseudo> <pseudo destinataire> <montant>",
        description: "Envoie du Ryo directement à un autre joueur, sans frais. Uniquement en PV.",
        exemple: "!virement 1234 paul marie 5000",
        category: "banque"
    },
    deposer: {
        usage: "!deposer <code> <pseudo> <montant>",
        description: "Met de l'argent à l'abri sur ton épargne bancaire, séparée de ta bourse courante. Uniquement en PV.",
        exemple: "!deposer 1234 paul 10000",
        category: "banque"
    },
    retirer: {
        usage: "!retirer <code> <pseudo> <montant>",
        description: "Retire de l'argent de ton épargne bancaire vers ta bourse courante. Uniquement en PV.",
        exemple: "!retirer 1234 paul 10000",
        category: "banque"
    },
    condbanque: {
        usage: "!condbanque",
        description: "Affiche toutes les conditions bancaires : création de compte, taux d'intérêt, plafond d'emprunt, délai de remboursement.",
        exemple: "!condbanque",
        category: "banque"
    },
    comptes: {
        usage: "!comptes",
        description: "(Admin) Liste tous les comptes bancaires actifs avec leur épargne et leur dette en cours.",
        exemple: "!comptes",
        adminOnly: true,
        category: "banque"
    },
    transactions: {
        usage: "!transactions <nombre>",
        description: "(Admin) Affiche les dernières transactions bancaires en cours sur l'ensemble du serveur.",
        exemple: "!transactions 30",
        adminOnly: true,
        category: "banque"
    },
    unlock: {
        usage: "!unlock <pseudo>",
        description: "(Admin) Débloque un compte bancaire suspendu ou bloqué en permanence suite à des prêts non remboursés. Si une dette reste due, un nouveau délai de 24h est accordé (la dette n'est PAS effacée).",
        exemple: "!unlock paul",
        adminOnly: true,
        category: "banque"
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
        usage: "!setstats <pseudo> <argent|stars|ticket> <valeur>",
        description: "(Admin) Fixe directement la bourse, les stars, ou le nombre de tickets de réduction d'un joueur à une valeur précise (remplace l'ancienne valeur).",
        exemple: "!setstats paul ticket 3",
        adminOnly: true,
        category: "admin"
    },
    setmenumedia: {
        usage: "!setmenumedia <nom_du_menu> <url>  |  (en réponse à une image/vidéo) !setmenumedia <nom_du_menu>",
        description: "(Admin) Change l'image ou la vidéo affichée par un menu du bot (ex: !menu). Le type (image/vidéo) est détecté automatiquement selon l'URL ou le média envoyé.",
        exemple: "!setmenumedia menu https://files.catbox.moe/exemple.mp4",
        adminOnly: true,
        category: "admin"
    },
    donnercarte: {
        usage: "!donnercarte <nom de la carte> <pseudo>",
        description: "(Admin) Ajoute manuellement une carte du catalogue à la collection d'un joueur, gratuitement.",
        exemple: "!donnercarte Naruto Uzumaki paul",
        adminOnly: true,
        category: "admin"
    },
    stats: {
        usage: "!stats globales",
        description: "Affiche des statistiques globales sur l'ensemble des joueurs (Ryo en circulation, cartes possédées, victoires totales...).",
        exemple: "!stats globales",
        category: "admin"
    },
    reset: {
        usage: "!reset <pseudo>",
        description: "(Admin) Remet à zéro toutes les statistiques d'un joueur (bourse, stars, victoires, défaites, points), en gardant son pseudo.",
        exemple: "!reset paul",
        adminOnly: true,
        category: "admin"
    },
    parilibre: {
        usage: "!parilibre debut <p1> <p2>  |  !parilibre liste  |  !parilibre off [id] winner: <pseudo>",
        description: "Ouvre une session de paris 1v1 entre deux joueurs (plusieurs sessions peuvent tourner en même temps dans le même chat). Les cotes sont calculées à partir du classement (points) des deux joueurs. La clôture (!parilibre off) n'est pas réservée aux admins, mais uniquement à la personne qui a ouvert la session concernée.",
        exemple: "!parilibre debut naruto sasuke",
        category: "casino"
    },
    parier: {
        usage: "!parier <ton_pseudo> <montant> <pseudo_choisi> [id]",
        description: "Place une mise sur l'un des deux joueurs d'une session de paris libre active. Si plusieurs sessions actives impliquent ce pseudo, précise l'ID de la session (visible via !parilibre liste). La mise est débitée immédiatement ; le gain (mise × cote) n'est crédité qu'à la clôture si ton favori gagne.",
        exemple: "!parier paul 5000 naruto",
        category: "casino"
    },
    modifierpari: {
        usage: "!modifierpari <pseudo> <nouveau_montant> [id]",
        description: "Change le montant d'un pari déjà placé (la cote reste celle du pari initial). Si le nouveau montant est plus élevé, la différence est débitée ; s'il est plus bas, la différence est remboursée.",
        exemple: "!modifierpari paul 8000",
        category: "casino"
    },
    mesparis: {
        usage: "!mesparis <pseudo>",
        description: "Affiche tous les paris en cours d'un joueur, tous chats confondus (montant, cible, cote, gain potentiel).",
        exemple: "!mesparis paul",
        category: "casino"
    },
    parishistorique: {
        usage: "!parishistorique [pseudo]",
        description: "Affiche l'historique des sessions de paris déjà clôturées (les 10 plus récentes). Avec un pseudo, filtre sur les paris de ce joueur ou les sessions où il s'est battu.",
        exemple: "!parishistorique paul",
        category: "casino"
    },
    banfiche: {
        usage: "!banfiche <pseudo> [raison]",
        description: "(Admin) Bannit manuellement une fiche : le joueur ne peut plus jouer à des jeux ni acheter de cartes, jusqu'à !unbanfiche. Indépendant du système de prêts bancaires.",
        exemple: "!banfiche paul comportement toxique",
        adminOnly: true,
        category: "admin"
    },
    unbanfiche: {
        usage: "!unbanfiche <pseudo>",
        description: "(Admin) Lève un ban manuel posé avec !banfiche.",
        exemple: "!unbanfiche paul",
        adminOnly: true,
        category: "admin"
    },
    resetfiche: {
        usage: "!resetfiche <pseudo>",
        description: "(Admin) Réinitialise ENTIÈREMENT une fiche : argent, stars, stats, inventaire de cartes, et compte bancaire (épargne/dette/suspensions), en gardant le pseudo. Plus complet que !reset qui ne touche que les stats.",
        exemple: "!resetfiche paul",
        adminOnly: true,
        category: "admin"
    },
    listegroupes: {
        usage: "!listegroupes",
        description: "(Admin) Liste tous les groupes WhatsApp où le bot est actuellement présent, avec leur ID et leur nombre de membres.",
        exemple: "!listegroupes",
        adminOnly: true,
        category: "admin"
    },
    quittergroupe: {
        usage: "!quittergroupe <id_groupe>",
        description: "(Admin) Fait quitter le bot d'un groupe WhatsApp donné. Tapée sans argument directement dans un groupe, le bot quitte ce groupe-là.",
        exemple: "!quittergroupe 120363012345678901@g.us",
        adminOnly: true,
        category: "admin"
    },
    broadcast: {
        usage: "!broadcast <message>",
        description: "(Admin) Diffuse un message dans TOUS les groupes où le bot est actuellement présent.",
        exemple: "!broadcast Maintenance ce soir à 20h, le bot sera indisponible 10 minutes.",
        adminOnly: true,
        category: "admin"
    },

    // --- Gestion de groupe (admin du groupe OU admin du bot) ---
    tagall: {
        usage: "!tagall [message]",
        description: "Mentionne visiblement tous les membres du groupe courant (la liste des numéros est affichée dans le message). Réservé aux admins du groupe ou du bot.",
        exemple: "!tagall Réunion RP ce soir !",
        category: "groupe"
    },
    hidetag: {
        usage: "!hidetag [message]",
        description: "Notifie tous les membres du groupe (ils reçoivent une notification) SANS afficher la liste des numéros dans le message. Réservé aux admins du groupe ou du bot.",
        exemple: "!hidetag Regardez l'annonce ci-dessus !",
        category: "groupe"
    },
    kick: {
        usage: "!kick @membre [@membre2 ...]",
        description: "Exclut un ou plusieurs membres mentionnés du groupe. Le bot doit lui-même être admin du groupe. Réservé aux admins du groupe ou du bot.",
        exemple: "!kick @33612345678",
        category: "groupe"
    },
    promote: {
        usage: "!promote @membre [@membre2 ...]",
        description: "Promeut un ou plusieurs membres mentionnés admin du groupe. Le bot doit lui-même être admin du groupe. Réservé aux admins du groupe ou du bot.",
        exemple: "!promote @33612345678",
        category: "groupe"
    },
    demote: {
        usage: "!demote @membre [@membre2 ...]",
        description: "Retire le statut admin d'un ou plusieurs membres mentionnés. Le bot doit lui-même être admin du groupe. Réservé aux admins du groupe ou du bot.",
        exemple: "!demote @33612345678",
        category: "groupe"
    },
    groupinfo: {
        usage: "!groupinfo",
        description: "Affiche les informations du groupe courant : nom, description, nombre de membres, liste des admins, et si le groupe est verrouillé.",
        exemple: "!groupinfo",
        category: "groupe"
    },
    setgroupname: {
        usage: "!setgroupname <nouveau nom>",
        description: "Change le nom du groupe courant. Le bot doit lui-même être admin du groupe. Réservé aux admins du groupe ou du bot.",
        exemple: "!setgroupname Shinobi Storm RP 🔶",
        category: "groupe"
    },
    setgroupdesc: {
        usage: "!setgroupdesc <nouvelle description>",
        description: "Change la description du groupe courant. Le bot doit lui-même être admin du groupe. Réservé aux admins du groupe ou du bot.",
        exemple: "!setgroupdesc Bienvenue sur le serveur RP officiel !",
        category: "groupe"
    },
    fermergroupe: {
        usage: "!fermergroupe",
        description: "Verrouille le groupe : seuls les admins peuvent écrire (mode annonces). Le bot doit lui-même être admin du groupe. Réservé aux admins du groupe ou du bot.",
        exemple: "!fermergroupe",
        category: "groupe"
    },
    ouvrirgroupe: {
        usage: "!ouvrirgroupe",
        description: "Déverrouille le groupe : tous les membres peuvent de nouveau écrire. Le bot doit lui-même être admin du groupe. Réservé aux admins du groupe ou du bot.",
        exemple: "!ouvrirgroupe",
        category: "groupe"
    },
};

// Image associée à chaque catégorie, affichée avec la réponse de !aide <commande>.
// "general" n'a pas d'image dédiée (pas reçue) ; les catégories sans image
// listées ici retombent simplement sur un message texte sans visuel.
const CATEGORY_IMAGES = {
    combat: "https://files.catbox.moe/jchbi8.jpg",
    cartes: "https://files.catbox.moe/jchbi8.jpg",
    casino: "https://files.catbox.moe/04bcjy.jpg", // réutilise l'image de !casino
    banque: "https://files.catbox.moe/pq45uy.jpg",
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
