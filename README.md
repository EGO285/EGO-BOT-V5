# 🤖 E.V.O — EGO VIRTUAL OPERATOR

Bot WhatsApp (basé sur Baileys) pour serveur RP / casino / banque, avec fiches joueurs
persistantes sur **Upstash Redis**. Créé par **ego**.

E.V.O n'est pas un simple bot : il se présente comme un assistant IA, répond avec des
formulations **différentes à chaque interaction**, et quand tu tapes une commande de
travers il te souffle ce que tu voulais sûrement écrire (_« tu voulais pas écrire !tirage
à tout hasard ? »_).

---

## 🚀 Installation

```bash
npm install
cp .env.example .env   # puis remplis tes valeurs
npm start
```

## 🔑 Configuration (fichier `.env`)

Copie `.env.example` en `.env` et remplis **tes propres** valeurs :

| Variable | Rôle |
|---|---|
| `USE_QR_CODE` | `true` = connexion par **QR code** (page `/qr`). `false` = code de jumelage (pairing) dans les logs. |
| `PHONE_NUMBER` | Numéro WhatsApp du bot **sans le +** (ex : `33612345678`). Requis seulement pour le pairing, inutile en mode QR. |
| `UPSTASH_REDIS_REST_URL` | L'URL REST de **ta** base Upstash Redis (onglet *REST API* de ton dashboard Upstash). |
| `UPSTASH_REDIS_REST_TOKEN` | Le token REST de **ta** base Upstash. ⚠️ Ne le partage jamais, ne le commit pas. |
| `QR_SECRET` | (optionnel) Jeton fixe protégeant la page QR. |
| `PORT` | Port du serveur HTTP (healthcheck + page QR). |
| `HF_TOKEN` | (optionnel) Jeton **Hugging Face** gratuit pour rendre `!evo` réellement intelligent. Sans lui, `!evo` marche en mode local. |
| `HF_MODEL` | (optionnel) Modèle Hugging Face utilisé par `!evo`. |

### 🔗 Brancher TA base Upstash

1. Va sur [console.upstash.com](https://console.upstash.com) → ta base Redis → onglet **REST API**.
2. Copie `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` dans ton `.env`.
3. C'est tout — toutes les fiches joueurs, l'économie et la banque se stockent dedans,
   et **rien n'est perdu** entre deux redémarrages.

> ℹ️ L'ancien `.env.example` contenait des identifiants Upstash en dur : ils ont été
> retirés et remplacés par des placeholders. Utilise bien **les tiens**.

## 📱 Connexion par QR CODE (par défaut)

Avec `USE_QR_CODE=true` :

1. Lance le bot (`npm start`).
2. Ouvre dans ton navigateur l'URL affichée dans les logs :
   `https://ton-app.onrender.com/qr?token=<QR_SECRET>` (ou `http://localhost:3000/qr?token=<QR_SECRET>` en local).
   La page affiche le **QR code** et se rafraîchit toute seule (le QR expire après ~60s).
3. Sur le téléphone du bot : WhatsApp → *Appareils connectés* → *Connecter un appareil*
   → scanne le QR.

> ℹ️ Fixe une valeur stable dans `QR_SECRET` (sinon un secret aléatoire est régénéré à
> chaque démarrage — tu le retrouves quand même dans les logs). En local, `PHONE_NUMBER`
> n'est pas nécessaire en mode QR.

### Alternative : PAIRING CODE

Mets `USE_QR_CODE=false` + `PHONE_NUMBER` (sans `+`) : un **code à 8 caractères** s'affiche
dans les logs, à saisir via WhatsApp → *Connecter un appareil* → *Se connecter avec un numéro*.


## 🧠 `!evo` — vraie IA via Hugging Face

La commande `!evo <message>` peut parler à un **vrai modèle de langage** hébergé chez
Hugging Face (rien n'est chargé en local, donc ça marche même sur une petite instance).

1. Crée un jeton gratuit sur [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) (type **Read**).
2. Mets-le dans `HF_TOKEN` (dans `.env` ou dans les variables Render).
3. (optionnel) Choisis un modèle via `HF_MODEL`.

E.V.O garde un **court historique** de la conversation par chat (contexte), se présente
comme créé par *ego*, et répond en français de façon concise et variée.
`!evo reset` efface la mémoire de la conversation en cours.

> Sans `HF_TOKEN`, ou si l'API Hugging Face est indisponible, `!evo` **retombe
> automatiquement** sur des réponses locales variées : la commande ne casse jamais.

## 👑 Admins

Ajoute tes numéros (sans `+`) dans `ADMIN_NUMBERS` en haut de `index.js`.

---

## 🧩 Commandes

Tape **`!menu`** pour tout voir, **`!aide <commande>`** pour le détail d'une commande,
**`!about`** pour la présentation de E.V.O, et **`!evo <message>`** pour discuter avec lui.

### ✨ Nouveautés E.V.O (52 commandes ajoutées)

**E.V.O / Général** — `!about` · `!evo` · `!botinfo` · `!uptime` · `!heure` · `!calc` · `!avatar`

**Nouveaux jeux casino** — `!crash` · `!mines` · `!penalty` · `!chifoumi` · `!course` ·
`!fleche` · `!grattage` · `!plinko` · `!wheel` · `!keno` · `!bataille` · `!echelle`

**Économie / métiers RP** — `!travailler` · `!salaire` · `!aumone` · `!peche` · `!miner` ·
`!chasser` · `!quete` · `!crime` · `!braquage` · `!casse` · `!contrebande` · `!entreprise` ·
`!investir` · `!voler` · `!don`

**Fun / social** — `!8ball` · `!roll` · `!pileouface` · `!ship` · `!niveau` · `!citation` ·
`!blague` · `!motivation` · `!compliment` · `!clash` · `!choix` · `!sondage` · `!quiz` +
`!rep` · `!defi` · `!verite` · `!horoscope` · `!tagadmins`

Toutes les commandes qui touchent à l'argent utilisent la **fiche joueur Upstash** (crée
une fiche avec `!new <pseudo>`), et les métiers ont un **cooldown** (temps d'attente).

---

## 🗂️ Architecture

- `index.js` — connexion WhatsApp, serveur HTTP, dispatcher des commandes + **suggestion
  anti-faute** (Levenshtein).
- `plugins/*.js` — une commande = un fichier `{ command, adminOnly?, handler }`, chargé
  automatiquement au démarrage.
- `utils/users.js` — couche de données Upstash (fiches, banque, casino).
- `utils/evoVoice.js` — personnalité locale de E.V.O : pools de phrases variées, repli hors-ligne de `!evo`, message « vouliez-vous dire… ? ».
- `utils/evoAI.js` — cerveau IA de `!evo` : appel à l'API Hugging Face + historique de conversation + repli automatique sur evoVoice.
- `utils/evoGame.js` — helpers des nouveaux jeux/métiers (cooldowns, hasard).
- `utils/suggest.js` — distance de Levenshtein + suggestion de la commande la plus proche.
- `utils/quizState.js` — état partagé du quiz entre `!quiz` et `!rep`.

_E.V.O — EGO VIRTUAL OPERATOR · créé par ego._
