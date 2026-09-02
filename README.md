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
| `USE_QR_CODE` | `false` = connexion par **code de jumelage (pairing code)** — recommandé. `true` = QR à scanner. |
| `PHONE_NUMBER` | Numéro WhatsApp du bot, format international **sans le +** (ex : `33612345678`). Requis pour le pairing. |
| `UPSTASH_REDIS_REST_URL` | L'URL REST de **ta** base Upstash Redis (onglet *REST API* de ton dashboard Upstash). |
| `UPSTASH_REDIS_REST_TOKEN` | Le token REST de **ta** base Upstash. ⚠️ Ne le partage jamais, ne le commit pas. |
| `QR_SECRET` | (optionnel) Jeton fixe protégeant la page QR. |
| `PORT` | Port du serveur HTTP (healthcheck + page QR). |

### 🔗 Brancher TA base Upstash

1. Va sur [console.upstash.com](https://console.upstash.com) → ta base Redis → onglet **REST API**.
2. Copie `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` dans ton `.env`.
3. C'est tout — toutes les fiches joueurs, l'économie et la banque se stockent dedans,
   et **rien n'est perdu** entre deux redémarrages.

> ℹ️ L'ancien `.env.example` contenait des identifiants Upstash en dur : ils ont été
> retirés et remplacés par des placeholders. Utilise bien **les tiens**.

## 📱 Connexion par PAIRING CODE

Avec `USE_QR_CODE=false` et `PHONE_NUMBER` renseigné :

1. Lance le bot (`npm start`).
2. Un **code à 8 caractères** s'affiche dans les logs.
3. Sur le téléphone du bot : WhatsApp → *Appareils connectés* → *Connecter un appareil*
   → *Se connecter avec un numéro de téléphone* → saisis le code.

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
- `utils/evoVoice.js` — personnalité de E.V.O : pools de phrases variées, réponses `!evo`,
  message « vouliez-vous dire… ? ».
- `utils/evoGame.js` — helpers des nouveaux jeux/métiers (cooldowns, hasard).
- `utils/suggest.js` — distance de Levenshtein + suggestion de la commande la plus proche.
- `utils/quizState.js` — état partagé du quiz entre `!quiz` et `!rep`.

_E.V.O — EGO VIRTUAL OPERATOR · créé par ego._
