# 🎴 EGO BOT V5

Bot WhatsApp de RP de combat, géré via [Baileys](https://github.com/WhiskeySockets/Baileys). Permet de jouer des combats narratifs en groupe, de gérer des duels officiels, un système de fiches joueurs avec économie (Ryo, stars), une collection de cartes à tirer, un casino complet, et désormais un jeu complet de commandes d'administration de groupe.

## ✨ Fonctionnalités

- **Combat RP** — arène ouverte où les joueurs écrivent leurs propres pavés de combat, jugés par `!verdict`
- **Duels officiels** — duels entre deux joueurs mentionnés, avec historique
- **Chronomètres** — pour structurer le temps de jeu en groupe (pause/reprise)
- **Fiches joueurs** — pseudo, bourse, stars, victoires/défaites, classement — stockées sur **Upstash Redis** (persistant, survit aux redéploiements), avec repli automatique sur un fichier local si Upstash n'est pas configuré
- **Cartes à collectionner** — tirage aléatoire par rareté (Commun/Rare/Épique/Légendaire), recherche par nom
- **Casino** — 5 jeux (pile/face, machine à sous, dés, roulette, higher/lower), chaque mise est déduite et chaque gain ajouté directement sur la fiche du joueur
- **Connexion QR code ou pairing code** — au choix via `USE_QR_CODE`
- **Gestion de groupe complète** — tagall, hidetag, kick, promote, demote, infos groupe, changement de nom/description, verrouillage/déverrouillage
- **Commandes admin** — gestion des comptes (ajout d'argent, reset, suppression), diffusion (`!broadcast`) dans tous les groupes

## 🚀 Installation

```bash
npm install
cp .env.example .env   # puis remplis les valeurs (voir tableau ci-dessous)
node index.js
```

### Connexion à WhatsApp : QR code ou pairing code

Deux méthodes sont disponibles, choisies via la variable d'environnement `USE_QR_CODE` :

- **`USE_QR_CODE=false`** (par défaut) — un **code de jumelage (pairing code)** s'affiche dans les logs du terminal après quelques secondes : entre-le dans WhatsApp (Paramètres → Appareils connectés → Connecter un appareil → Connecter avec un numéro de téléphone).
- **`USE_QR_CODE=true`** — un **QR code** est généré et servi en image sur une URL protégée par un jeton : `http://<url_du_bot>/qr?token=<QR_SECRET>` (l'URL exacte est affichée dans les logs au démarrage). Scanne-le depuis WhatsApp (Paramètres → Appareils connectés → Connecter un appareil). La page se rafraîchit automatiquement toutes les 15s tant que le QR n'a pas été scanné.

⚠️ Garde l'URL du QR secrète : elle permet de lier n'importe quel téléphone au bot à ta place. Fixe `QR_SECRET` dans les variables d'environnement pour un lien stable (sinon un secret aléatoire est régénéré à chaque démarrage).

### Variables d'environnement

| Variable | Description |
|---|---|
| `USE_QR_CODE` | `true` pour la connexion par QR code, `false` (défaut) pour le pairing code |
| `PHONE_NUMBER` | Numéro WhatsApp à utiliser pour le pairing (sans le `+`), utilisé uniquement en mode pairing code |
| `QR_SECRET` | Jeton secret protégeant l'URL du QR (`/qr?token=...`). Fixe une valeur stable pour un lien qui ne change pas à chaque redémarrage |
| `PORT` | Port du serveur HTTP de healthcheck et de la page QR (utile sur Render/Heroku) |
| `UPSTASH_REDIS_REST_URL` | URL de ta base Upstash (dashboard Upstash → ta base → section "REST API") |
| `UPSTASH_REDIS_REST_TOKEN` | Token de ta base Upstash (même section) |

⚠️ Sans les deux variables Upstash, les commandes liées aux fiches joueurs (`!new`, `!fiche`, le casino, etc.) ne fonctionneront pas. Le reste du bot (combat RP, duel, chrono, cartes) n'en a pas besoin.

### Configuration des admins

Les numéros administrateurs sont définis en haut de `index.js` :

```js
const ADMIN_NUMBERS = ["330665384876", "233275249576"];
```

Modifie cette liste pour ajouter ou retirer des admins.

## 📋 Commandes

### ⚔️ Combat RP
| Commande | Description |
|---|---|
| `!combat` | Ouvre une arène de combat dans le chat |
| `!verdict PAVÉ1 vs PAVÉ2` | Analyse deux pavés de combat et désigne un vainqueur |
| `!pave ego` | Gabarit vierge de pavé RP |
| `!pave modo` | Gabarit des règles d'arbitrage de duel |
| `!fiche verdict` | Gabarit de verdict de duel classé |
| `!win <pseudo>` 🛡️ | Enregistre une victoire (+3 pts, +50 000 Ryo) |
| `!lose <pseudo>` 🛡️ | Enregistre une défaite (+10 000 Ryo de compensation) |
| `!stopfight` | Annule le combat en cours |

### 🥷 Duel
| Commande | Description |
|---|---|
| `!duel debut @j1 vs @j2` | Lance un duel officiel |
| `!duel off winner: @joueur` | Termine le duel et enregistre le vainqueur |
| `!historique` | Affiche les 10 derniers duels |

### ⏱️ Chrono
| Commande | Description |
|---|---|
| `!timer <minutes>` | Lance un chronomètre personnalisé (1 à 60 min) |
| `!latence` | Lance un chronomètre fixe de 7 minutes |
| `!pause` / `!go` / `!stop` | Met en pause, reprend, ou arrête le chronomètre |

### 👤 Joueurs
| Commande | Description |
|---|---|
| `!new <pseudo>` | Crée une nouvelle fiche joueur |
| `!fiche <pseudo>` | Affiche la fiche complète d'un joueur |
| `!classement` | Top 10 des joueurs par points |
| `!rang <pseudo>` | Rang précis d'un joueur dans le classement |

### 🎴 Cartes
| Commande | Description |
|---|---|
| `!tirage c/b/a/s/random` | Tire une carte au hasard selon la rareté |
| `!carte <nom>` | Recherche et affiche la fiche d'une carte précise |
| `!rules` | Affiche les règles du bot/RP |

### 🎰 Casino
| Commande | Mise | Gains |
|---|---|---|
| `!casino` | — | Liste complète des jeux |
| `!pof <pile/face> <pseudo>` | 2 000🔶 | x2 |
| `!machine <pseudo>` | 5 000🔶 | Paire x2, Triple x5, Jackpot 💎💎💎 x10 |
| `!des <plus/moins/exact> <pseudo>` | 3 000🔶 | x1.8 (plus/moins), x4 (exact) |
| `!roulette <rouge/noir/vert> <pseudo>` | 4 000🔶 | x2 (rouge/noir), x14 (vert) |
| `!hl <plus/moins> <pseudo>` | 2 500🔶 | x1.8 |

Chaque jeu vérifie que le pseudo a une fiche existante et assez de fonds avant de jouer.

### 🛡️ Admin
| Commande | Description |
|---|---|
| `!delete <pseudo>` | Supprime définitivement un joueur |
| `!addmoney <pseudo> <montant>` | Ajoute de l'argent à un joueur |
| `!addstars <pseudo> <montant>` | Ajoute des stars à un joueur |
| `!reset <pseudo>` | Remet à zéro les statistiques d'un joueur |
| `!photobot <url ou image jointe>` | Change la photo de profil du bot |
| `!listegroupes` | Liste tous les groupes où le bot est présent |
| `!quittergroupe <id>` | Fait quitter le bot d'un groupe |
| `!broadcast <message>` | Diffuse un message dans TOUS les groupes où le bot est présent |

### 🛡️ Gestion de groupe

Ces 10 commandes sont utilisables par un **admin du groupe WhatsApp**, ou par un **admin du bot** (`ADMIN_NUMBERS`), même s'il n'est pas admin de ce groupe précis. Les actions qui modifient le groupe (kick, promote, demote, changer le nom/la description, verrouiller/déverrouiller) exigent en plus que **le bot lui-même soit admin** de ce groupe.

| Commande | Description |
|---|---|
| `!tagall [message]` | Mentionne visiblement tous les membres (liste affichée) |
| `!hidetag [message]` | Notifie tous les membres sans afficher la liste |
| `!kick @membre` | Exclut un ou plusieurs membres mentionnés |
| `!promote @membre` | Promeut un ou plusieurs membres admin du groupe |
| `!demote @membre` | Retire le statut admin d'un ou plusieurs membres |
| `!groupinfo` | Affiche nom, description, membres, admins, statut de verrouillage |
| `!setgroupname <nom>` | Change le nom du groupe |
| `!setgroupdesc <description>` | Change la description du groupe |
| `!fermergroupe` | Verrouille le groupe (seuls les admins peuvent écrire) |
| `!ouvrirgroupe` | Déverrouille le groupe |

### ❓ Aide
| Commande | Description |
|---|---|
| `!menu` | Affiche le menu principal |
| `!aide <commande>` | Affiche le détail d'une commande précise (avec image selon la catégorie) |

## 📁 Structure du projet

```
EGO-BOT-V5-main/
├── index.js              # Point d'entrée, connexion WhatsApp (QR/pairing), serveur HTTP, routeur de commandes
├── chronoData.js         # État en mémoire des chronomètres actifs/en pause
├── cartes.json           # Base de données des cartes à collectionner
├── .env.example          # Modèle des variables d'environnement à copier en .env
├── plugins/              # Une commande = un fichier (dont les 10 commandes de gestion de groupe)
├── utils/
│   ├── users.js               # Lecture/écriture des fiches joueurs sur Upstash Redis
│   └── groupPermissions.js    # Permissions communes aux commandes de gestion de groupe
└── data/
    ├── duels.json        # Duels actifs et historique (fichier local, non persistant sur Render)
    └── combats.json      # Combats RP actifs (fichier local, non persistant sur Render)
```

## ⚠️ Points de vigilance

- **Fiches joueurs (`!new`, `!fiche`, casino...)** sont stockées sur Upstash Redis — persistantes même après un redéploiement Render.
- **Duels et combats RP** restent stockés en fichiers JSON locaux — ces données sont perdues à chaque redéploiement sur Render (disque éphémère). Seules les fiches joueurs ont été migrées.
- Les fiches joueurs sont identifiées par un **pseudo en texte libre**, pas par le numéro WhatsApp de la personne — n'importe qui connaissant un pseudo peut consulter ou, pour les commandes admin, modifier le compte associé.
- `!photobot` change la photo de profil **du compte WhatsApp connecté au bot**, visible par tous ses contacts : à réserver aux admins de confiance.
- Les commandes de gestion de groupe qui modifient le groupe (`!kick`, `!promote`, `!demote`, `!setgroupname`, `!setgroupdesc`, `!fermergroupe`, `!ouvrirgroupe`) exigent que le **bot lui-même soit admin** du groupe concerné — sinon WhatsApp refuse l'action côté serveur.
- Si `USE_QR_CODE=true`, garde l'URL `/qr?token=...` secrète : quiconque la connaît peut lier son propre téléphone au bot.

## 🔱 Crédits

Powered by **EGO ATLAS**
