# Gnomads, simulateur web d'algorithmes

Gnomads est un jeu de plateau éducatif sur les algorithmes (projet MyDigitalSchool Lyon). Chaque joueur déplace un nain de jardin (gnome) sur un plateau en posant des cartes qui forment un petit algorithme. Le premier gnome qui atteint le trésor au centre du jardin gagne.

Ce site n'est **pas** une version numérique du jeu. C'est un outil de test : on place le gnome et des obstacles sur la grille, on compose un algorithme avec les cartes du jeu (8 cartes maximum, la taille d'une main), puis on regarde où le gnome arrive. Il n'y a ni adversaires, ni cartes malus.

## Vocabulaire

Le même que dans les règles du jeu physique, partout dans le code et l'interface :

- un gnome est **blocked** quand il ne peut pas avancer ;
- un **obstacle** est une case qui bloque le gnome (un rocher dans le simulateur) ;
- le **treasure** est la case d'arrivée, au centre du plateau.

## Utilisation

1. **Place gnome** : toucher une case pour y poser le gnome. **Direction** : choisir N / E / S / W, ou toucher le gnome pour le faire tourner vers sa droite. **Obstacles** : toucher une case pour poser ou retirer un rocher.
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

Les tests portent sur `js/logic/`, qui ne touche jamais au DOM : plateau (y compris d'une autre taille que 11), gnome, interpréteur (déplacements, blocages, Repeat imbriqués, If / Else, trésor, limite d'étapes) et limite de 8 cartes.

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
│   ├── board.css       Grille (colonnes = BOARD_SIZE), cases, gnome, effets d'animation
│   └── cards.css       Cartes (palette et algorithme), couleurs par famille, cartes à droite
├── js/
│   ├── main.js         Point d'entrée : état de l'appli, création des vues, branchements
│   ├── config.js       Toutes les constantes (BOARD_SIZE, trésor, 8 cartes, étapes, vitesse…)
│   ├── i18n.js         Tous les textes de l'interface, dont le nom et le texte de chaque carte
│   ├── logic/          LOGIQUE PURE : jamais de DOM, testable avec Node
│   │   ├── board.js        Plateau : cases, obstacles, bord, blocage
│   │   ├── gnome.js        Gnome : position, direction, rotations, case devant/derrière
│   │   ├── cards.js        Catalogue des cartes + création d'instances
│   │   ├── program.js      Algorithme en arbre : ajout, suppression, règles du Else, limite de 8
│   │   └── interpreter.js  Exécution : renvoie la liste des étapes, sans animation
│   └── ui/             AFFICHAGE : lit la logique, ne la modifie jamais
│       ├── boardView.js    Dessin du jardin, toucher sur une case
│       ├── paletteView.js  Palette (nom + texte des cartes) + filtre par niveau
│       ├── programView.js  Algorithme, compteur, conteneur sélectionné, surlignage
│       ├── controls.js     Modes de la barre d'outils + boutons
│       └── animator.js     Lecture des étapes (auto / pas à pas) + message final
├── assets/
│   ├── img/logo_gnomads.png  Logo fourni par l'équipe
│   └── icons/          Icônes SVG aux couleurs de la charte (gnome, rocher, trésor)
└── tests/              Tests node:test
```

### Principes

- **Logique et affichage séparés.** `js/logic/` n'utilise ni `document` ni `window`. `js/ui/` affiche et transmet les actions de l'utilisateur à `main.js`, qui met à jour la logique puis redessine.
- **Taille du plateau dans une seule constante.** `BOARD_SIZE` (`config.js`) donne la grille, le trésor (case centrale calculée), le nombre de colonnes CSS et la position de départ du gnome.
- **L'interpréteur ne fait pas d'animation.** `runProgram()` calcule toutes les étapes d'un coup (`{ gnome, cardUid, event }`). `animator.js` les rejoue avec `ANIMATION_DELAY_MS` entre chaque.
- **Charte graphique** : uniquement les 8 couleurs de `css/base.css` et le blanc ; textes en noir.
- **Obstacles futurs** (burrow, root, rake) : les types existent dans `CELL_TYPES` (`config.js`), leurs styles dans `board.css`, et leur effet se code dans `applySquareEffect()` (`interpreter.js`). Pour qu'un obstacle bloque le gnome, l'ajouter à `BLOCKING_TYPES` (`board.js`).

### Ajouter une carte

1. Ajouter son id dans `CARD_IDS` et sa définition dans `CARD_CATALOGUE` (`js/logic/cards.js`).
2. Ajouter son nom et son texte dans `TEXTS.cards` (`js/i18n.js`).
3. Si elle utilise une nouvelle `action`, écrire son handler dans `interpreter.js` et l'ajouter à `CARD_HANDLERS`.
