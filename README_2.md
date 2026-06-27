# 🎴 EGO BOT V4

Bot WhatsApp de RP de combat, géré via [Baileys](https://github.com/WhiskeySockets/Baileys). Permet de jouer des combats narratifs en groupe, de gérer des duels officiels, un système de fiches joueurs avec économie (Ryo, stars), une collection de cartes à tirer, et un casino complet.

## ✨ Fonctionnalités

- **Combat RP** — arène ouverte où les joueurs écrivent leurs propres pavés de combat, jugés par `!verdict`
- **Duels officiels** — duels entre deux joueurs mentionnés, avec historique
- **Chronomètres** — pour structurer le temps de jeu en groupe (pause/reprise)
- **Fiches joueurs** — pseudo, bourse, stars, victoires/défaites, classement — stockées sur **Upstash Redis** (persistant, survit aux redéploiements)
- **Cartes à collectionner** — tirage aléatoire par rareté (Commun/Rare/Épique/Légendaire), recherche par nom
- **Casino** — 5 jeux (pile/face, machine à sous, dés, roulette, higher/lower), chaque mise est déduite et chaque gain ajouté directement sur la fiche du joueur
- **Commandes admin** — gestion des comptes (ajout d'argent, reset, suppression)

## 🚀 Installation

```bash
npm install
node index.js
```

Au premier démarrage, un code de pairing s'affiche dans le terminal : entre-le dans WhatsApp (Paramètres → Appareils connectés → Connecter un appareil) pour lier le bot à un numéro WhatsApp.

### Variables d'environnement

| Variable | Description |
|---|---|
| `PHONE_NUMBER` | Numéro WhatsApp à utiliser pour le pairing (sans le `+`), remplace la valeur par défaut codée en dur |
| `PORT` | Port du serveur HTTP de healthcheck (utile sur Render/Heroku) |
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

### ❓ Aide
| Commande | Description |
|---|---|
| `!menu` | Affiche le menu principal |
| `!aide <commande>` | Affiche le détail d'une commande précise (avec image selon la catégorie) |

## 📁 Structure du projet

```
EGO-BOT-V4-main/
├── index.js              # Point d'entrée, connexion WhatsApp et routeur de commandes
├── chronoData.js         # État en mémoire des chronomètres actifs/en pause
├── cartes.json           # Base de données des cartes à collectionner
├── plugins/              # Une commande = un fichier
├── utils/
│   └── users.js          # Lecture/écriture des fiches joueurs sur Upstash Redis
└── data/
    ├── duels.json        # Duels actifs et historique (fichier local, non persistant sur Render)
    └── combats.json      # Combats RP actifs (fichier local, non persistant sur Render)
```

## ⚠️ Points de vigilance

- **Fiches joueurs (`!new`, `!fiche`, casino...)** sont stockées sur Upstash Redis — persistantes même après un redéploiement Render.
- **Duels et combats RP** restent stockés en fichiers JSON locaux — ces données sont perdues à chaque redéploiement sur Render (disque éphémère). Seules les fiches joueurs ont été migrées.
- Les fiches joueurs sont identifiées par un **pseudo en texte libre**, pas par le numéro WhatsApp de la personne — n'importe qui connaissant un pseudo peut consulter ou, pour les commandes admin, modifier le compte associé.
- `!photobot` change la photo de profil **du compte WhatsApp connecté au bot**, visible par tous ses contacts : à réserver aux admins de confiance.

## 🔱 Crédits

Powered by **EGO ATLAS**
