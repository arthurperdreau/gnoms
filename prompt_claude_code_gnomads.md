
# Projet : Gnomads, simulateur web d'algorithmes
 
## Contexte
 
Gnomads est un jeu de plateau éducatif sur les algorithmes, réalisé dans le cadre d'un projet d'école (MyDigitalSchool Lyon). Chaque joueur déplace un nain de jardin (gnome) sur un plateau en posant des cartes qui forment un petit algorithme. Le premier gnome qui atteint le trésor au centre du jardin gagne.
 
La partie web n'est PAS une version numérique du jeu. C'est uniquement un outil de test : le joueur place son gnome et des obstacles sur une grille, compose un algorithme avec n'importe quelle carte du jeu, puis regarde où son gnome arrive. Il n'y a ni adversaires, ni cartes malus.
 
## Ta mission
 
Crée la structure complète du projet et tous les fichiers ci-dessous. Dans chaque fichier, écris un squelette : les fonctions, classes et constantes prévues, avec leur signature, un commentaire JSDoc qui explique leur rôle, leurs paramètres et ce qu'elles retournent, et des commentaires `// TODO:` qui décrivent précisément ce qu'il faut coder à l'intérieur. N'écris pas l'implémentation complète : l'équipe codera elle-même à partir de ces indications.
 
Les fichiers HTML et CSS peuvent être écrits en entier (structure de page et styles de base), puisqu'ils servent de support au code JS.
 
Ne fais pas de commit git. À la fin, affiche l'arborescence créée et un résumé de ce que contient chaque fichier.
 
## Contraintes techniques
 
- HTML, CSS et JavaScript natifs uniquement. Aucun framework, aucune librairie, aucun outil de build.
- JavaScript en modules ES (`type="module"`, `import` / `export`).
- Aucun backend : le site doit fonctionner en fichiers statiques (hébergement prévu sur GitLab Pages).
- Mobile first : utilisable au téléphone, interactions au toucher (clic), pas de glisser-déposer.
- Séparer strictement la logique (plateau, gnome, interpréteur) de l'affichage (DOM). Les fichiers de logique ne doivent jamais toucher au DOM, pour pouvoir être testés avec Node.
- Textes de l'interface en anglais, regroupés dans des constantes pour pouvoir les traduire facilement.
- Code commenté, noms de variables et de fonctions en anglais.
- Respecter la charte graphique décrite plus bas (couleurs et logo).
## Vocabulaire
 
Utilise ces mots partout (code, textes de l'interface, commentaires), pour rester cohérent avec les règles du jeu physique :
 
- On dit qu'un gnome est **blocked** quand il ne peut pas avancer. N'utilise jamais le mot "wall".
- Un **obstacle** est une case qui bloque le gnome. Dans le jeu physique, ce sont les rochers, les pots de fleur et les brouettes. Dans le simulateur, un seul type d'obstacle suffit, affiché comme un rocher.
- Le **treasure** est la case d'arrivée au centre du plateau.
## Règles du simulateur
 
### Plateau
- La taille du plateau n'est pas encore décidée par l'équipe. Elle doit être définie dans une seule constante `BOARD_SIZE` (valeur provisoire : 11). Tout le code (grille, CSS, position du trésor, tests) doit s'adapter à cette constante. N'écris jamais la taille en dur ailleurs.
- Coordonnées `x` de 0 à `BOARD_SIZE - 1` (gauche vers droite), `y` de 0 à `BOARD_SIZE - 1` (haut vers bas).
- Types de cases dans cette première version : case vide, obstacle, trésor.
- Le trésor est fixe, sur la case centrale, calculée à partir de `BOARD_SIZE`.
- Le joueur peut placer et retirer des obstacles sur n'importe quelle case, sauf le trésor et la case du gnome.
- Le bord du plateau bloque aussi le gnome.
- Prévoir le code pour pouvoir ajouter plus tard les autres obstacles du jeu physique. Ne pas les implémenter, seulement laisser la structure prête (par exemple un objet de types de cases et un endroit clair où gérer leur effet) :
  - **burrow** (terrier) : le gnome retourne à sa case de départ ;
  - **root** (racine) : le gnome glisse tout droit jusqu'à être bloqué ;
  - **rake** (râteau) : le gnome est repoussé de 2 cases, dans le sens opposé à celui d'où il arrivait.
### Gnome
- Un seul gnome, défini par sa position `x`, `y` et sa direction : `N`, `E`, `S` ou `W`.
- Le joueur choisit la case de départ et la direction du gnome.
### Cartes disponibles
 
Utilise exactement ces noms et ces textes : ce sont ceux des cartes physiques.
 
| Carte | Famille | Niveau | Texte affiché sur la carte |
|---|---|---|---|
| Forward 1 | movement | 1 | Your gnome moves 1 square forward. |
| Forward 2 | movement | 1 | Your gnome moves 2 squares forward. If it is blocked, it stops. |
| Back 1 | movement | 1 | Your gnome moves 1 square back. It keeps looking the same way. |
| Turn left | movement | 1 | Your gnome turns to its left. |
| Turn right | movement | 1 | Your gnome turns to its right. |
| U-turn | movement | 1 | Your gnome turns around and looks the other way. |
| Repeat 2 times | loop | 2 | Do the cards on the right of this card 2 times. |
| Repeat 3 times | loop | 2 | Do the cards on the right of this card 3 times. |
| Repeat 4 times | loop | 2 | Do the cards on the right of this card 4 times. |
| If blocked | condition | 3 | If your gnome can't move forward, do the card on the right. |
| If not blocked | condition | 3 | If your gnome can move forward, do the card on the right. |
| Else | condition | 3 | Put it under an If card. If the If is false, do the card on the right. |
 
- Niveaux : 1 = beginner, 2 = intermediate, 3 = expert. Prévoir un filtre par niveau dans la palette.
- "Turn left" et "Turn right" se font par rapport au gnome (sa gauche, sa droite), pas par rapport à l'écran.
- Toutes les cartes sont disponibles dans le simulateur, sans limite de quantité.
- Les cartes malus du jeu physique (Wheelbarrow, Freeze, Shield, Bug) n'existent pas dans le simulateur.
- Une carte "Repeat" contient une ou plusieurs cartes.
- Une carte "If blocked" ou "If not blocked" contient une carte. Elle peut être suivie d'une carte "Else", qui contient elle aussi une carte. Un "Else" n'est valide que juste après un "If".
- Les cartes peuvent s'imbriquer (un Repeat dans un Repeat, un If dans un Repeat, etc.).
- Limite : 8 cartes maximum par algorithme (la taille d'une main dans le jeu physique), en comptant toutes les cartes posées, y compris celles contenues dans un Repeat, un If ou un Else. Mettre cette limite dans une constante.
### Exécution
- Quand le gnome doit avancer ou reculer vers un obstacle ou le bord, il est bloqué et reste sur sa case actuelle. Ce n'est pas une erreur : l'algorithme continue avec la carte suivante.
- Les déplacements de plusieurs cases se font case par case, pour que le blocage fonctionne à chaque pas.
- "If blocked" et "If not blocked" testent la case devant le gnome, dans sa direction actuelle.
- Si le gnome arrive sur le trésor, l'exécution s'arrête et affiche une victoire, même si l'algorithme n'est pas fini.
- Prévoir une sécurité contre les boucles trop longues (nombre maximum d'étapes dans une constante).
- L'interpréteur ne fait aucune animation : il calcule et retourne la liste complète des étapes (position, direction, carte en cours, événement : moved, blocked, turned, treasure). L'animation est gérée à part, à partir de cette liste.
- À la fin, afficher un message clair : trésor atteint, ou algorithme terminé avec la position finale et le nombre de fois où le gnome a été bloqué.
## Interface
 
- En haut : le logo Gnomads, puis la grille.
- Sous la grille, une barre d'outils avec 3 modes : placer le gnome, placer ou retirer un obstacle, choisir la direction du gnome.
- La palette de cartes, filtrable par niveau. Toucher une carte l'ajoute à l'algorithme. Chaque carte affiche son nom et son texte.
- La zone "algorithme" se lit de haut en bas, comme dans le jeu physique. Les cartes contenues dans un Repeat, un If ou un Else s'affichent sur la même ligne, à droite de cette carte. Toucher un Repeat, un If ou un Else le sélectionne comme destination : les prochaines cartes ajoutées vont à l'intérieur. Un bouton pour revenir au niveau principal. Un bouton pour supprimer une carte.
- Un compteur "cartes utilisées / 8".
- Les boutons : Run (lance l'animation), Step (avance d'une étape), Reset gnome (remet le gnome à sa position de départ), Clear (vide l'algorithme), Clear obstacles.
- Pendant l'animation, la carte en cours est surlignée et le gnome se déplace case par case (environ 400 ms par étape, valeur dans une constante).
## Charte graphique
 
Palette officielle du projet. Mets ces couleurs en variables CSS dans `css/base.css` et utilise-les partout. N'ajoute aucune autre couleur, sauf le blanc pour les fonds.
 
| Variable | Couleur | Usage |
|---|---|---|
| `--color-blue` | `#73b6e5` | cartes de déplacement |
| `--color-purple` | `#a97fb7` | cartes de boucle (Repeat) |
| `--color-coral` | `#ef7d5d` | cartes de condition (If, Else) |
| `--color-green` | `#a3ca63` | cases du jardin |
| `--color-yellow` | `#f8da46` | trésor |
| `--color-pink` | `#f08bb8` | carte en cours pendant l'animation, conteneur sélectionné |
| `--color-orange` | `#f59e51` | boutons principaux (Run, Step) |
| `--color-black` | `#000000` | textes |
 
- Vérifie que les textes restent lisibles sur chaque couleur (contraste suffisant).
- Le logo est fourni par l'équipe dans `assets/img/logo_gnomads.png`. C'est un logo horizontal : le mot "GNOMADS" en lettres arrondies et multicolores, avec une tête de gnome à chapeau champignon à la place du "O". Crée le dossier `assets/img/` (l'équipe y déposera le fichier) et affiche le logo en haut de la page, en largeur maximale 100 %, avec le texte alternatif "Gnomads".
- Style général : arrondi et ludique, comme le logo. Coins arrondis sur les cartes, les boutons et les cases.
## Arborescence à créer
 
```
gnomads-web/
├── index.html
├── README.md
├── package.json
├── css/
│   ├── base.css
│   ├── board.css
│   └── cards.css
├── js/
│   ├── main.js
│   ├── config.js
│   ├── i18n.js
│   ├── logic/
│   │   ├── board.js
│   │   ├── gnome.js
│   │   ├── cards.js
│   │   ├── program.js
│   │   └── interpreter.js
│   └── ui/
│       ├── boardView.js
│       ├── paletteView.js
│       ├── programView.js
│       ├── controls.js
│       └── animator.js
├── assets/
│   ├── img/
│   │   └── logo_gnomads.png   (fourni par l'équipe, ne pas le créer)
│   └── icons/
│       ├── gnome.svg
│       ├── obstacle.svg
│       └── treasure.svg
└── tests/
    ├── board.test.js
    └── interpreter.test.js
```
 
## Contenu attendu de chaque fichier
 
- **index.html** : structure de la page (logo, grille, barre d'outils, palette, zone algorithme, boutons, zone de message), meta viewport pour le mobile, chargement des CSS et de `js/main.js` en module.
- **README.md** : présentation du projet, comment le lancer en local (avec un petit serveur statique, car les modules ES ne marchent pas en ouvrant le fichier directement), comment lancer les tests, comment déployer sur GitLab Pages, où déposer le logo, et l'explication de l'organisation des dossiers.
- **package.json** : uniquement `"type": "module"` et un script `"test": "node --test tests/"`. Aucune dépendance.
- **css/base.css** : variables CSS de la charte graphique, tailles, reset léger, mise en page mobile first, logo, boutons, zone de message.
- **css/board.css** : grille en CSS Grid dont le nombre de colonnes vient de la taille du plateau, qui s'adapte à la largeur de l'écran ; styles des cases (vide, obstacle, trésor, gnome) ; indication visuelle de la direction du gnome ; mise en évidence pendant l'animation.
- **css/cards.css** : styles des cartes dans la palette et dans l'algorithme, couleur par famille selon la charte, cartes contenues affichées à droite de leur conteneur, carte surlignée, conteneur sélectionné.
- **js/config.js** : constantes (`BOARD_SIZE`, position du trésor calculée, directions, types de cases avec ceux prévus pour plus tard, nombre maximum de cartes, nombre maximum d'étapes, vitesse d'animation).
- **js/i18n.js** : tous les textes de l'interface en anglais, dans un objet exporté.
- **js/main.js** : point d'entrée. Crée l'état de l'application (plateau, gnome, algorithme), initialise les vues et branche les événements.
- **js/logic/board.js** : classe ou fonctions du plateau : créer la grille, lire une case, placer et retirer un obstacle, vérifier si une case est dans le plateau, vérifier si une case bloque le gnome, réinitialiser.
- **js/logic/gnome.js** : état du gnome, tourner à gauche, à droite, demi-tour (par rapport au gnome), calculer la case devant et la case derrière, cloner l'état.
- **js/logic/cards.js** : catalogue de toutes les cartes (id, nom, texte de la carte, famille, niveau, paramètres) et fonctions pour créer une instance de carte à ajouter dans un algorithme.
- **js/logic/program.js** : gestion de l'algorithme sous forme d'arbre : ajouter une carte au niveau principal ou dans un conteneur, supprimer une carte, compter toutes les cartes, vérifier la limite de 8, vérifier qu'un "Else" suit bien un "If".
- **js/logic/interpreter.js** : fonction principale qui reçoit le plateau, le gnome de départ et l'algorithme, et retourne la liste des étapes et le résultat final. Une fonction par type de carte. Gestion récursive des Repeat, des If et des Else. Sécurité sur le nombre d'étapes.
- **js/ui/boardView.js** : dessine la grille dans le DOM, met à jour une case, affiche le gnome et sa direction, gère le toucher sur une case selon le mode actif.
- **js/ui/paletteView.js** : affiche les cartes disponibles (nom et texte), le filtre par niveau, gère l'ajout d'une carte au toucher.
- **js/ui/programView.js** : affiche l'algorithme de haut en bas avec les cartes contenues à droite, le conteneur sélectionné, le compteur de cartes, la suppression d'une carte, le surlignage de la carte en cours.
- **js/ui/controls.js** : barre d'outils (modes) et boutons Run, Step, Reset gnome, Clear, Clear obstacles.
- **js/ui/animator.js** : joue la liste des étapes avec une pause entre chaque, en mode automatique ou pas à pas, avec la possibilité d'arrêter, et affiche le message final.
- **assets/icons/*.svg** : icônes simples et lisibles aux couleurs de la charte (gnome vu de dessus avec un repère de direction, rocher pour l'obstacle, coffre au trésor).
- **tests/board.test.js** et **tests/interpreter.test.js** : tests avec `node:test` et `node:assert`. Écris la liste des cas à tester sous forme de tests vides ou de `TODO` : avancer sur une case libre, être bloqué par un obstacle, être bloqué par le bord, Forward 2 bloqué après une case, reculer, tourner à gauche et à droite par rapport au gnome, demi-tour, Repeat simple, Repeat imbriqué, If blocked vrai, If not blocked vrai, If faux avec Else, arrivée sur le trésor au milieu de l'algorithme, dépassement du nombre maximum d'étapes, limite de 8 cartes, plateau d'une autre taille que 11.
 
