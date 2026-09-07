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
- **Monde** : `carte` · `voyager <lieu>` · `explorer`
- **Missions** : `mission` · `mission <n>` · `mission combattre` · `mission finir` · `abandonner`
- **Progression** : `entrainer <type>` · `apprendre <tech>` · `rang` (passer un grade)
- **Survie** : `manger` · `boire` · `dormir [h]`
- **Économie** : `boutique [nom]` · `acheter <boutique> <objet>` · `vendre <objet>`
- **Social** : `relations` · `reputation`
- **Système** : `difficulte <narratif|normal|shinobi|hardcore>` · `mortpermanente on/off` · `sauvegarde` · `supprimer confirmer`
- **En combat** : `attaquer` · `jutsu <nom>` · `defendre` · `esquiver` · `objet <obj>` · `analyser` · `fuir`

## Systèmes implémentés (moteur réel)
Fiche OC complète · stats + stats dérivées · XP/niveaux/points · rangs académie→légende ·
techniques (coût chakra, maîtrise, natures & affinités, cooldown) · clans (bonus + Kekkei Genkai) ·
inventaire + objets à effets · économie Ryo + boutiques (prix modulés par réputation) ·
survie (faim/soif/fatigue/moral) · combat tour par tour déterministe (touche/esquive/dégâts/
endurance/boss multi-phases) · missions (D→S, combat & non-combat) · exploration + carte (graphe) +
rencontres aléatoires contrôlées · temps/calendrier/météo/jour-nuit · PNJ + relations + mémoire +
réputations · mentors (apprentissage sous condition de relation) · KO/mort selon difficulté ·
sauvegarde auto Upstash + logs · narration IA optionnelle avec repli.

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
