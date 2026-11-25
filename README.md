# Gnomads, simulateur web d'algorithmes

Gnomads est un jeu de plateau éducatif sur les algorithmes (projet MyDigitalSchool Lyon). Chaque joueur déplace un nain de jardin (gnome) sur un plateau en posant des cartes qui forment un petit algorithme. Le premier gnome qui atteint le trésor au centre du jardin gagne.

Ce site n'est **pas** une version numérique du jeu. C'est un outil de test : on place le gnome et des obstacles sur la grille, on compose un algorithme avec les cartes du jeu (8 cartes maximum, la taille d'une main), puis on regarde où le gnome arrive. Il n'y a ni adversaires, ni cartes malus.

## Vocabulaire

Le même que dans les règles du jeu physique, partout dans le code et l'interface :

- un gnome est **blocked** quand il ne peut pas avancer ;
- un **obstacle** est une case qui bloque le gnome (un rocher dans le simulateur) ;
- le **treasure** est la zone d'arrivée (2 × 2 cases) au centre du plateau.

## Le plateau

Le simulateur utilise le plateau imprimé du jeu (`assets/img/board.png`) : 14 colonnes × 13 lignes. Les cases cliquables sont posées exactement sur la grille de l'image. Les éléments imprimés ont un effet quand le gnome arrive dessus :

| Case | Effet |
|---|---|
| Empreintes (4 coins) | cases de départ : le gnome part forcément de l'une d'elles |
| Treasure (2 × 2 au centre) | victoire, l'algorithme s'arrête |
| Champignon | le gnome avance d'une case de plus, dans le sens où il allait |
| Terrier | le gnome retourne à sa case de départ |
| Racine (2 cases) | le gnome glisse tout droit jusqu'à être bloqué |
| Râteau | le gnome est repoussé de 2 cases, dans le sens opposé à son arrivée |
| Rocher (ajouté par le joueur) | obstacle : le gnome est blocked |

Les effets peuvent s'enchaîner (un râteau qui repousse sur un champignon…). Une chaîne sans fin est arrêtée par la limite d'étapes. La fin d'une glissade ou d'une poussée contre un obstacle ne compte pas comme « blocked ».

Les positions de tous les éléments sont dans `BOARD_LAYOUT` (`js/config.js`), et la position de la grille dans l'image dans `BOARD_IMAGE`. Si l'équipe change le plateau, il suffit de remplacer l'image et de mettre à jour ces deux objets.

## Utilisation

1. **Place gnome** : toucher une des 4 empreintes (surlignées en jaune) pour y poser le gnome. **Direction** : choisir N / E / S / W, ou toucher le gnome pour le faire tourner vers sa droite. **Obstacles** : toucher une case vide pour poser ou retirer un rocher.
2. Toucher une carte de la palette pour l'ajouter à l'algorithme. L'algorithme se lit de haut en bas ; les cartes contenues dans un Repeat, un If ou un Else sont à sa droite.
   - Un Repeat, un If ou un Else qu'on vient de poser reçoit les cartes suivantes. Toucher un de ces conteneurs pour le sélectionner, ou **Back to main level** pour revenir au niveau principal.
   - Un If et un Else contiennent une seule carte.
   - Un Else se pose juste sous un If : sélectionner le If (ou ajouter le Else juste après lui), puis toucher Else.
3. **Run** joue l'algorithme (le bouton devient **Stop**), **Step** avance d'une étape. La carte en cours est surlignée en rose et un message final s'affiche.

## Logo

Le logo de l'équipe se dépose dans `assets/img/logo_gnomads.png`. Il est affiché en haut de la page, en largeur maximale 100 %.

## Lancer en local

Le site utilise des modules ES (`<script type="module">`). Les navigateurs les bloquent quand on ouvre `index.html` directement (`file://`), il faut donc un petit serveur statique :

```bash
python3 -m http.server 8000
# ou
npx serve .
```

Puis ouvrir <http://localhost:8000>. Pour tester sur téléphone, ouvrir `http://<IP-de-l-ordinateur>:8000` depuis le même réseau Wi-Fi.

## Lancer les tests

Il faut Node.js 21 ou plus récent. Aucune dépendance à installer.

```bash
npm test
```

Le script lance `node --test "tests/*.test.js"`. (`node --test tests/`, avec un dossier, ne fonctionne plus depuis Node 21.)

Les tests portent sur `js/logic/`, qui ne touche jamais au DOM : plateau imprimé et plateaux d'autres tailles, gnome, interpréteur (déplacements, blocages, Repeat imbriqués, If / Else, trésor, limite d'étapes, effets des cases spéciales) et limite de 8 cartes. La plupart utilisent un plateau simple de 11 × 11 (`tests/helpers/layouts.js`) pour que les cases imprimées ne gênent pas.

## Déployer sur GitLab Pages

Ajouter un fichier `.gitlab-ci.yml` à la racine du dépôt :

```yaml
pages:
  stage: deploy
  script:
    - mkdir -p public
    - cp -r index.html css js assets public/
  artifacts:
    paths:
      - public
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

Après un push sur la branche principale, le site est publié à l'adresse indiquée dans *Deploy > Pages*. Tous les chemins sont relatifs, donc le site fonctionne dans un sous-dossier (`https://<groupe>.gitlab.io/<projet>/`).

Sur GitHub Pages, aucun fichier n'est nécessaire : *Settings > Pages > Deploy from a branch*, branche principale, dossier `/ (root)`. Le fichier `.nojekyll` empêche GitHub de passer le site dans Jekyll.

## Organisation des dossiers

```
├── index.html          Structure de la page (logo, jardin, outils, cartes, algorithme, boutons)
├── package.json        "type": "module" + script de test, aucune dépendance
├── css/
│   ├── base.css        Charte graphique (variables), reset, mise en page mobile first, boutons
│   ├── board.css       Image du plateau, grille cliquable posée dessus, gnome, effets
│   └── cards.css       Cartes (palette et algorithme), couleurs par famille, cartes à droite
├── js/
│   ├── main.js         Point d'entrée : état de l'appli, création des vues, branchements
│   ├── config.js       Toutes les constantes (BOARD_LAYOUT, BOARD_IMAGE, 8 cartes, étapes, vitesse…)
│   ├── i18n.js         Tous les textes de l'interface, dont le nom et le texte de chaque carte
│   ├── logic/          LOGIQUE PURE : jamais de DOM, testable avec Node
│   │   ├── board.js        Plateau : cases imprimées, rochers, bord, blocage, départs
│   │   ├── gnome.js        Gnome : position, direction, rotations, case devant/derrière
│   │   ├── cards.js        Catalogue des cartes + création d'instances
│   │   ├── program.js      Algorithme en arbre : ajout, suppression, règles du Else, limite de 8
│   │   └── interpreter.js  Exécution et effets des cases : renvoie la liste des étapes
│   └── ui/             AFFICHAGE : lit la logique, ne la modifie jamais
│       ├── boardView.js    Image du plateau + cases cliquables, gnome, rochers
│       ├── paletteView.js  Palette (nom + texte des cartes) + filtre par niveau
│       ├── programView.js  Algorithme, compteur, conteneur sélectionné, surlignage
│       ├── controls.js     Modes de la barre d'outils + boutons
│       └── animator.js     Lecture des étapes (auto / pas à pas) + message final
├── assets/
│   ├── img/logo_gnomads.png  Logo fourni par l'équipe
│   ├── img/board.png         Plateau imprimé fourni par l'équipe
│   └── icons/          Icônes SVG aux couleurs de la charte (gnome, rocher, trésor)
└── tests/              Tests node:test (+ helpers/layouts.js : petits plateaux de test)
```

### Principes

- **Logique et affichage séparés.** `js/logic/` n'utilise ni `document` ni `window`. `js/ui/` affiche et transmet les actions de l'utilisateur à `main.js`, qui met à jour la logique puis redessine.
- **Plateau décrit dans un seul objet.** `BOARD_LAYOUT` (`config.js`) donne la taille, le trésor, les départs et les cases spéciales ; la grille, les colonnes CSS et la position du gnome en découlent.
- **L'interpréteur ne fait pas d'animation.** `runProgram()` calcule toutes les étapes d'un coup (`{ gnome, cardUid, event }`). `animator.js` les rejoue avec `ANIMATION_DELAY_MS` entre chaque.
- **Charte graphique** : uniquement les 8 couleurs de `css/base.css` et le blanc ; textes en noir (les images fournies par l'équipe ont leurs propres couleurs).
- **Cases spéciales** : types dans `CELL_TYPES` (`config.js`), effets dans `applySquareEffect()` (`interpreter.js`). Pour qu'un type bloque le gnome, l'ajouter à `BLOCKING_TYPES` (`board.js`).

### Ajouter une carte

1. Ajouter son id dans `CARD_IDS` et sa définition dans `CARD_CATALOGUE` (`js/logic/cards.js`).
2. Ajouter son nom et son texte dans `TEXTS.cards` (`js/i18n.js`).
3. Si elle utilise une nouvelle `action`, écrire son handler dans `interpreter.js` et l'ajouter à `CARD_HANDLERS`.
