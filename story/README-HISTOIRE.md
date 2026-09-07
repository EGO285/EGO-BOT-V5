# 🍥 SHINOBI STORM — MODE HISTOIRE OC

RPG Naruto textuel **persistant**, piloté par un moteur de jeu déterministe et **narré** par
l'IA (E.V.O). Déclenché par **`!histoire`**.

## Règle d'or (architecture)
```
JOUEUR → COMMANDE (!histoire) → GAME ENGINE (stats, RNG, combat, mondes…) → IA GM (narration) → SAUVEGARDE (Upstash)
```
Le **code** calcule TOUT (dégâts, réussite, XP, chakra, RNG). L'**IA** ne fait qu'habiller le
résultat en récit — elle ne décide jamais d'un chiffre. Le jeu **fonctionne même sans IA**
(narration = texte mécanique) et **sans réseau** (repli mémoire).

## Démarrer
```
!histoire commencer                       # crée ton ninja (nécessite une fiche Shinobi Storm : !new <pseudo>)
!histoire commencer clan=uchiha prenom=Kaito sexe=M
!histoire                                 # reprend / affiche ton état
!histoire aide                            # toutes les sous-commandes
```

## Sous-commandes
- **Personnage** : `fiche` · `stats <stat>` (dépenser un point) · `jutsu` · `sac` · `objet <obj>`
- **Monde** : `carte` · `voyager <lieu>` · `explorer` · `aventurer` _(open-world généré par IA)_
- **Missions** : `mission` · `mission <n>` · `mission combattre` · `mission finir` · `abandonner`
- **Progression** : `entrainer <type>` · `apprendre <tech>` · `rang` (passer un grade)
- **Survie** : `manger` · `boire` · `dormir [h]`
- **Économie** : `boutique [nom]` · `acheter <boutique> <objet>` · `vendre <objet>`
- **Social** : `relations` · `reputation`
- **Système** : `difficulte <narratif|normal|shinobi|hardcore>` · `mortpermanente on/off` · `sauvegarde` · `supprimer confirmer`
- **Combat en PAVÉ LIBRE** : tu écris ton action (*!histoire je fonce et lance un Katon Goukakyuu*). L'IA résout selon la **difficulté**, le moteur **valide ton arsenal** (jutsu/objets réellement possédés — sinon tu es *immobile/à découvert*), déduit chakra/objets et **borne les dégâts** (anti-triche). `fuir` pour partir.
- **pause / resume** : *!histoire pause* sauvegarde et quitte ; *!histoire resume* reprend (même en plein combat).
- **Coop** : *!histoire coop creer* / *coop rejoindre <code>* / *coop combat* (boss partagé, récompenses pour toute l'équipe) / *coop quitter*.
- **(ancien) En combat menu** : `attaquer` · `jutsu <nom>` · `defendre` · `esquiver` · `objet <obj>` · `analyser` · `fuir`

## Systèmes implémentés (moteur réel)
Fiche OC complète · stats + stats dérivées · XP/niveaux/points · rangs académie→légende ·
techniques (coût chakra, maîtrise, natures & affinités, cooldown) · clans (bonus + Kekkei Genkai) ·
inventaire + objets à effets · économie Ryo + boutiques (prix modulés par réputation) ·
survie (faim/soif/fatigue/moral) · combat tour par tour déterministe (touche/esquive/dégâts/
endurance/boss multi-phases) · missions (D→S, combat & non-combat) · exploration + carte (graphe) +
rencontres aléatoires contrôlées · temps/calendrier/météo/jour-nuit · PNJ + relations + mémoire +
réputations · mentors (apprentissage sous condition de relation) · KO/mort selon difficulté ·
sauvegarde auto Upstash + logs · narration IA optionnelle avec repli.

## 🎬 Histoire Principale (canon Naruto → Boruto: Two Blue Vortex)
`!histoire principale` fait vivre à ton OC la trame canon, chapitre par chapitre : Académie →
trahison de Mizuki → Pays des Vagues (Zabuza, Haku) → Examen Chūnin (Gaara) → Konoha Crush →
Shippūden (Deidara, Kakuzu, Itachi, Pain) → Grande Guerre (Obito, Madara, Kaguya) → The Last
(Toneri) → Boruto (Momoshiki) → Kara (Isshiki) → **Two Blue Vortex (Code)**.
Les scènes s'enchaînent avec *!histoire principale suivant* ; les combats de boss avec
*!histoire principale combat*. Chaque chapitre gagné débloque le suivant et donne de gros gains.
26 chapitres, 12 arcs — extensible via `story/data/campaign.js`.

## ⚔️ Ripostes & imprévus
- **Ripostes ennemies** : à chaque tour, l'ennemi contre-attaque avec SES propres jutsu selon son niveau et la difficulté.
- **Événements inattendus** : les missions et les combats peuvent déclencher des imprévus (renforts, ouvertures, pièges, second souffle de l'ennemi...).

## 🌍 Open-world procédural (généré par IA)
`!histoire aventurer` fait partir ton ninja **vers l'inconnu** : l'IA (Hugging Face) **génère un
nouveau lieu** (nom, description, ambiance, type), le moteur **valide et borne** les valeurs
mécaniques (danger, services), puis le lieu est **sauvegardé dans ta carte personnelle** (Upstash,
clé `story:map:<pseudo>`). Tu peux y **revenir plus tard** : le monde que tu as exploré persiste
d'une session à l'autre, exactement tel que découvert. Sans IA disponible, un générateur local
prend le relais (le monde s'étend quand même). Les lieux générés apparaissent dans `!histoire carte`
(marqués ✨) et sont reliés bidirectionnellement au reste du monde.

## Multijoueur
Chaque joueur a **sa propre sauvegarde** liée à sa fiche : plusieurs personnes jouent en parallèle
sans interférence (chacun `!histoire ...` de son côté). La structure de présence par lieu
(`story:world`) est en place pour le monde partagé (croiser d'autres joueurs), à activer/enrichir
ensuite. Le PvP peut être branché sur l'arbitre Shinobi Storm existant.

## Ajouter du contenu SANS toucher au moteur (séparation données/engine)
Tout le contenu vit dans `story/data/*.js` :
- `jutsu.js` — nouvelles techniques   · `clans.js` — clans & Kekkei Genkai
- `items.js` — objets & boutiques      · `locations.js` — nouveaux lieux/carte
- `missions.js` — missions             · `npcs.js` — PNJ & mentors
- `bosses.js` — boss                   · `events.js` — événements aléatoires
- `arcs.js` — arcs de la timeline (Académie → … → Two Blue Vortex)
- `ranks.js` / `natures.js` — progression & natures de chakra
Ajoute une entrée → elle est utilisable immédiatement, sans modifier `story/engine/`.

## Variables d'environnement
Aucune nouvelle : le mode réutilise **Upstash** (sauvegardes) et **HF_TOKEN/HF_MODEL** (narration).
Sans HF_TOKEN, le mode tourne en narration déterministe.

## Tests
```
node story/tests.js     # 14 tests moteur, sans réseau ni IA
```

## Feuille de route (extensible)
Le socle couvre toute la boucle de jeu. À enrichir par données : la timeline canon complète
arc par arc (académie → Chūnin → Shippūden → guerre → The Last → Boruto → Two Blue Vortex),
davantage de jutsu/clans/boss/lieux, le monde partagé multijoueur temps réel, les équipes,
l'infiltration/enquêtes avancées, et un tableau de bord web.
