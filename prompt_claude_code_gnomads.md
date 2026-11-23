# Projet : Gnomads, simulateur web d'algorithmes

## Contexte

Gnomads est un jeu de plateau éducatif sur les algorithmes, réalisé dans le cadre d'un projet d'école (MyDigitalSchool Lyon). Chaque joueur déplace un nain de jardin (gnome) sur un plateau de 11 x 11 cases en posant des cartes qui forment un petit algorithme.

La partie web n'est PAS une version numérique du jeu. C'est uniquement un outil de test : le joueur place son gnome et des murs sur une grille, compose un algorithme avec n'importe quelle carte du jeu, puis regarde où son gnome arrive.

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

## Règles du simulateur

### Plateau
- Grille de 11 x 11 cases. Coordonnées `x` de 0 à 10 (gauche vers droite), `y` de 0 à 10 (haut vers bas).
- Types de cases dans cette première version : case vide, mur, trésor.
- Le trésor est fixe, sur la case centrale (5, 5).
- Le joueur peut placer et retirer des murs sur n'importe quelle case sauf le trésor et la case du gnome.
- Le bord du plateau se comporte comme un mur.
- Prévoir le code pour pouvoir ajouter plus tard d'autres obstacles du jeu physique : terrier (renvoie au départ), racine (le gnome glisse tout droit jusqu'au prochain obstacle), râteau (repousse le gnome de 2 cases dans le sens opposé à son arrivée). Ne pas les implémenter, seulement laisser la structure prête (par exemple un objet de types de cases et un endroit clair où gérer leur effet).

### Gnome
- Un seul gnome, défini par sa position `x`, `y` et sa direction : `N`, `E`, `S` ou `W`.
- Le joueur choisit la case de départ et la direction du gnome.

### Cartes disponibles
| Carte | Effet |
|---|---|
| Forward 1 | avance d'une case |
| Forward 2 | avance de deux cases, une case à la fois |
| Back 1 | recule d'une case sans changer de direction |
| Turn left | tourne d'un quart de tour à gauche |
| Turn right | tourne d'un quart de tour à droite |
| U-turn | fait demi-tour |
| Repeat 2 / Repeat 3 / Repeat 4 | répète les cartes placées à l'intérieur |
| If wall ahead | exécute sa carte "then" seulement si la case devant est un mur ou le bord |
| If path clear | exécute sa carte "then" seulement si la case devant est libre |
| Else | se place dans une carte "If" et s'exécute quand la condition est fausse |

- Toutes les cartes du jeu sont disponibles dans le simulateur, sans limite de quantité.
- Chaque carte a un niveau (1 = beginner, 2 = intermediate, 3 = expert) : déplacements niveau 1, boucles niveau 2, conditions niveau 3. Prévoir un filtre par niveau dans la palette.
- Une carte "Repeat" contient une ou plusieurs cartes.
- Une carte "If" contient une carte "then" et, en option, une carte "else".
- Les cartes peuvent s'imbriquer (un Repeat dans un Repeat, un If dans un Repeat, etc.).
- Limite : 5 cartes maximum par algorithme, en comptant toutes les cartes posées, y compris celles à l'intérieur d'un Repeat ou d'un If (comme dans le jeu physique). Mettre cette limite dans une constante.

### Exécution
- Quand le gnome doit avancer ou reculer vers un mur (ou le bord), il reste bloqué devant, sur sa case actuelle. Ce n'est pas une erreur : l'algorithme continue avec la carte suivante.
- Les déplacements de plusieurs cases se font case par case, pour que le blocage par un mur fonctionne à chaque pas.
- Si le gnome arrive sur le trésor, l'exécution s'arrête et affiche une victoire.
- Prévoir une sécurité contre les boucles trop longues (nombre maximum d'étapes dans une constante).
- L'interpréteur ne fait aucune animation : il calcule et retourne la liste complète des étapes (position, direction, carte en cours, événement : moved, blocked, turned, treasure). L'animation est gérée à part, à partir de cette liste.
- À la fin, afficher un message clair : trésor atteint, algorithme terminé avec la position finale, ou nombre de fois où le gnome a été bloqué.

## Interface

- En haut : la grille 11 x 11.
- Sous la grille, une barre d'outils avec 3 modes : placer le gnome, placer ou retirer un mur, choisir la direction du gnome.
- La palette de cartes, filtrable par niveau. Toucher une carte l'ajoute à l'algorithme.
- La zone "algorithme" : la liste des cartes posées, avec un retrait visuel pour les cartes à l'intérieur d'un Repeat ou d'un If. Toucher un Repeat ou un If le sélectionne comme destination : les prochaines cartes ajoutées vont à l'intérieur. Un bouton pour revenir au niveau principal. Un bouton pour supprimer une carte.
- Un compteur "cartes utilisées / 5".
- Les boutons : Run (lance l'animation), Step (avance d'une étape), Reset gnome (remet le gnome à sa position de départ), Clear (vide l'algorithme), Clear walls.
- Pendant l'animation, la carte en cours est surlignée et le gnome se déplace case par case (environ 400 ms par étape, valeur dans une constante).

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
│   └── icons/
│       ├── gnome.svg
│       ├── wall.svg
│       └── treasure.svg
└── tests/
    ├── board.test.js
    └── interpreter.test.js
```

## Contenu attendu de chaque fichier

- **index.html** : structure de la page (grille, barre d'outils, palette, zone algorithme, boutons, zone de message), meta viewport pour le mobile, chargement des CSS et de `js/main.js` en module.
- **README.md** : présentation du projet, comment le lancer en local (avec un petit serveur statique, car les modules ES ne marchent pas en ouvrant le fichier directement), comment lancer les tests, comment déployer sur GitLab Pages, et l'explication de l'organisation des dossiers.
- **package.json** : uniquement `"type": "module"` et un script `"test": "node --test tests/"`. Aucune dépendance.
- **css/base.css** : variables CSS (couleurs du jardin, tailles), reset léger, mise en page mobile first, boutons, zone de message.
- **css/board.css** : grille en CSS Grid qui s'adapte à la largeur de l'écran, styles des cases (vide, mur, trésor, gnome), indication visuelle de la direction du gnome, mise en évidence pendant l'animation.
- **css/cards.css** : styles des cartes dans la palette et dans l'algorithme, couleur par famille (déplacement, boucle, condition), retrait des cartes imbriquées, carte surlignée, conteneur sélectionné.
- **js/config.js** : constantes (taille du plateau, position du trésor, directions, types de cases, nombre maximum de cartes, nombre maximum d'étapes, vitesse d'animation).
- **js/i18n.js** : tous les textes de l'interface en anglais, dans un objet exporté.
- **js/main.js** : point d'entrée. Crée l'état de l'application (plateau, gnome, algorithme), initialise les vues et branche les événements.
- **js/logic/board.js** : classe ou fonctions du plateau : créer la grille, lire une case, placer et retirer un mur, vérifier si une case est dans le plateau, vérifier si une case bloque, réinitialiser.
- **js/logic/gnome.js** : état du gnome, tourner à gauche, à droite, demi-tour, calculer la case devant et la case derrière, cloner l'état.
- **js/logic/cards.js** : catalogue de toutes les cartes (id, libellé, famille, niveau, paramètres) et fonctions pour créer une instance de carte à ajouter dans un algorithme.
- **js/logic/program.js** : gestion de l'algorithme sous forme d'arbre : ajouter une carte au niveau principal ou dans un conteneur, supprimer une carte, compter toutes les cartes, vérifier la limite de 5, vérifier qu'un "Else" est bien dans un "If".
- **js/logic/interpreter.js** : fonction principale qui reçoit le plateau, le gnome de départ et l'algorithme, et retourne la liste des étapes et le résultat final. Une fonction par type de carte. Gestion récursive des Repeat et des If. Sécurité sur le nombre d'étapes.
- **js/ui/boardView.js** : dessine la grille dans le DOM, met à jour une case, affiche le gnome et sa direction, gère le toucher sur une case selon le mode actif.
- **js/ui/paletteView.js** : affiche les cartes disponibles, le filtre par niveau, gère l'ajout d'une carte au toucher.
- **js/ui/programView.js** : affiche l'arbre de l'algorithme avec les retraits, le conteneur sélectionné, le compteur de cartes, la suppression d'une carte, le surlignage de la carte en cours.
- **js/ui/controls.js** : barre d'outils (modes) et boutons Run, Step, Reset gnome, Clear, Clear walls.
- **js/ui/animator.js** : joue la liste des étapes avec une pause entre chaque, en mode automatique ou pas à pas, avec la possibilité d'arrêter, et affiche le message final.
- **assets/icons/*.svg** : icônes simples et lisibles (gnome vu de dessus avec un repère de direction, mur, coffre au trésor).
- **tests/board.test.js** et **tests/interpreter.test.js** : tests avec `node:test` et `node:assert`. Écris la liste des cas à tester sous forme de tests vides ou de `TODO` : avancer sur une case libre, être bloqué par un mur, être bloqué par le bord, reculer, tourner, Repeat simple, Repeat imbriqué, If vrai, If faux avec Else, arrivée sur le trésor, dépassement du nombre maximum d'étapes, limite de 5 cartes.
