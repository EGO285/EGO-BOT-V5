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
| `EVO_MAX_TOURS` | (optionnel) Nb d'échanges gardés en mémoire par `!evo` (défaut 12). |
| `EVO_HIST_TTL` | (optionnel) Durée de vie de la mémoire `!evo`, en jours (défaut 30). |
| `HF_VISION_MODEL` | (optionnel) Modèle **vision** pour analyser les images (défaut Llama-3.2-11B-Vision). |
| `TAVILY_API_KEY` | (optionnel) Clé gratuite [Tavily](https://app.tavily.com) pour la **recherche internet**. Sans elle, E.V.O peut lire un lien mais ne cherche pas sur le web. |

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

**🧠 Mémoire persistante & par personne** : E.V.O garde l'historique **dans ton Upstash
Redis**, avec une clé **par personne** (`evo:hist:<chat>|<numéro>`). Dans un groupe, chaque
membre a donc son propre fil de conversation avec E.V.O, sans mélange ; en privé c'est
naturellement ta conversation à toi. Il se souvient donc de ce qu'on lui a dit **même
après un redémarrage ou un redéploiement** du bot. Réglable via `EVO_MAX_TOURS` (nombre
d'échanges gardés) et `EVO_HIST_TTL` (durée de vie en jours). `!evo reset` efface la
mémoire de la conversation en cours.

Il se présente comme créé par *ego* et répond en français, concis et varié.

> Si Upstash n'est pas configuré, la mémoire retombe en RAM (perdue au reboot).

> Sans `HF_TOKEN`, ou si l'API Hugging Face est indisponible, `!evo` **retombe
> automatiquement** sur des réponses locales variées : la commande ne casse jamais.

## 🌐 Internet, 🖼️ vision & ⚖️ arbitrage Shinobi Storm

**Accès internet** — `!evo` peut chercher sur le web et lire des liens :
- Recherche automatique quand la question a besoin d'infos fraîches (actu, prix, « qui a gagné… 2025 ? », météo…). Nécessite `TAVILY_API_KEY`.
- Lecture d'un lien : `!evo résume https://…` (aucune clé requise).
- `!web <recherche>` force une recherche web explicite.

**Vision (images)** — envoie une image **avec la légende** `!evo <question>`, ou **réponds** à une image avec `!evo <question>` : E.V.O l'analyse (nécessite `HF_TOKEN` + un modèle vision). Idem pour `!arbitre` avec une carte de personnage.

**Arbitre RP** — `!arbitre <ton action>` : E.V.O arbitre les duels selon les **règles officielles de Shinobi Storm** (créé par EGO WINTERSON, 11/09/2024). Il est neutre, applique la logique distance/vitesse/temps/trajectoire, refuse l'auto-hit et le métagaming, **garde la mémoire du combat** (positions, blessures, techniques, projectiles) et rend un **verdict motivé**. `!arbitre reset` réinitialise le duel. Les règles et la base de connaissances sont implantées dans E.V.O, qui est donc incollable sur Shinobi Storm (y compris via `!evo`).

## 🎭 Personnalités de E.V.O (9 au choix)

`!persona` affiche les 9 personnalités et celle active ; `!persona <numéro|nom>` en change :
**Classique 🤖 · Sensei 🧘 · Comique 😂 · Pro 💼 · Sarcastique 😏 · Hype 🔥 · Doux 🌸 · Rebelle 😼 · Poète 🎭**.
Le choix est **propre à chaque personne** (mémorisé dans Upstash) et ne change que le TON de `!evo`.
_L'arbitre `!arbitre` reste toujours neutre, quelle que soit la personnalité._

## 🎰 Limite hebdomadaire du casino

Chaque jeu du casino est limité à **10 utilisations par semaine et par compte** (limite indépendante par jeu : 10 `!pof`, 10 `!crash`, etc.). La semaine se réinitialise automatiquement tous les 7 jours. Réglable via la constante `CASINO_WEEKLY_MAX` en haut de la section casino de `utils/users.js`.

## 🧩 Conscience de soi & de la base

`!evo` sait **ce qu'il est** : quand tu lui demandes ce qu'il sait faire, quelles commandes existent ou comment marche une commande, il puise dans sa propre base d'aide. Et quand tu poses une question sur **les données du serveur** (« combien de joueurs ? », « qui est premier au classement ? », « combien Paul a de Ryo ? », « stats »), il lit **en direct ta base Upstash** (nombre de joueurs, top 10 points/bourse, Ryo en circulation, fiche d'un joueur cité) et répond avec les vraies valeurs.

## 🍥 Mode Histoire (RPG Naruto)

`!histoire` lance un **RPG Naruto textuel persistant** : crée ton ninja OC (genin → légende),
explore le monde, fais des missions, combats au **tour par tour** (moteur déterministe +
narration IA), progresse et sauvegarde ta partie dans Upstash. Plusieurs joueurs jouent en
parallèle, chacun sa sauvegarde. Détails complets et guide d'extension : **`story/README-HISTOIRE.md`**.
Tests moteur : `node story/tests.js`.

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
`!blague` · `!motivation` · `!compliment` · `!clash` (300+ variantes) · `!choix` · `!sondage` · `!quiz` +
`!rep` · `!defi` · `!verite` · `!horoscope` · `!tagadmins`

Toutes les commandes qui touchent à l'argent utilisent la **fiche joueur Upstash** (crée une fiche avec `!new <pseudo>`).

> ℹ️ Les commandes **métiers/économie** (`!travailler`, `!braquage`, `!crime`, `!voler`…) fonctionnent toujours mais **ne sont plus affichées dans `!menu`** (retirées à ta demande).

---

## 🗂️ Architecture

- `index.js` — connexion WhatsApp, serveur HTTP, dispatcher des commandes + **suggestion
  anti-faute** (Levenshtein).
- `plugins/*.js` — une commande = un fichier `{ command, adminOnly?, handler }`, chargé
  automatiquement au démarrage.
- `utils/users.js` — couche de données Upstash (fiches, banque, casino).
- `utils/evoVoice.js` — personnalité locale de E.V.O : pools de phrases variées, repli hors-ligne de `!evo`, message « vouliez-vous dire… ? ».
- `utils/evoAI.js` — cerveau IA : `!evo` (chat, vision, web, lore) et `!arbitre` (arbitrage), mémoire persistante Upstash + repli.
- `utils/evoWeb.js` — accès internet : recherche web (Tavily) + lecture de liens.
- `utils/evoMedia.js` — récupère/encode les images WhatsApp pour la vision.
- `utils/evoKnowledge.js` — conscience de soi : catalogue de ses commandes + lecture live de la base Upstash.
- `utils/evoPersona.js` — les 9 personnalités de !evo.
- `utils/shinobiLore.js` — base de connaissances + règles officielles de Shinobi Storm, injectées dans E.V.O et l'arbitre.
- `utils/evoGame.js` — helpers des nouveaux jeux/métiers (cooldowns, hasard).
- `utils/suggest.js` — distance de Levenshtein + suggestion de la commande la plus proche.
- `utils/quizState.js` — état partagé du quiz entre `!quiz` et `!rep`.

_E.V.O — EGO VIRTUAL OPERATOR · créé par ego._
