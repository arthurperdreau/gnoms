# Gnomads, simulateur web d'algorithmes

Gnomads est un jeu de plateau éducatif sur les algorithmes (projet MyDigitalSchool Lyon). Chaque joueur déplace un nain de jardin sur un plateau de 11 x 11 cases en posant des cartes qui forment un petit algorithme.

Ce site n'est **pas** une version numérique du jeu. C'est un outil de test : on place le gnome et des murs sur la grille, on compose un algorithme avec les cartes du jeu (5 cartes maximum), puis on regarde où le gnome arrive.

## Lancer en local

Le site utilise des modules ES (`<script type="module">`). Les navigateurs les bloquent quand on ouvre `index.html` directement (`file://`), il faut donc un petit serveur statique. Au choix :

```bash
# Python 3
python3 -m http.server 8000

# Node (sans installation permanente)
npx serve .
```

Puis ouvrir <http://localhost:8000>.

Pour tester sur téléphone : lancer le serveur sur l'ordinateur, puis ouvrir `http://<IP-de-l-ordinateur>:8000` depuis le téléphone, sur le même réseau Wi-Fi.

## Lancer les tests

Il faut Node.js 21 ou plus récent (le motif `tests/*.test.js` est résolu par Node lui-même). Aucune dépendance à installer.

```bash
npm test
# ou
node --test "tests/*.test.js"
```

Les tests ne portent que sur `js/logic/`, qui ne touche jamais au DOM. Les cas à écrire sont déjà listés dans `tests/` sous forme de `test.todo`.

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

Après un push sur la branche principale, le site est publié à l'adresse indiquée dans *Deploy > Pages* du projet GitLab. Tous les chemins sont relatifs, donc le site fonctionne aussi dans un sous-dossier (`https://<groupe>.gitlab.io/<projet>/`).

## Organisation des dossiers

```
gnomads-web/
├── index.html          Structure de la page
├── package.json        "type": "module" + script de test, aucune dépendance
├── css/
│   ├── base.css        Variables, reset, mise en page mobile first, boutons, messages
│   ├── board.css       Grille 11 x 11, cases, gnome, effets d'animation
│   └── cards.css       Cartes (palette et algorithme), familles, imbrication
├── js/
│   ├── main.js         Point d'entrée : état de l'appli, création des vues, branchements
│   ├── config.js       Toutes les constantes (taille, trésor, limites, vitesse…)
│   ├── i18n.js         Tous les textes de l'interface (anglais)
│   ├── logic/          LOGIQUE PURE : jamais de DOM, testable avec Node
│   │   ├── board.js        Plateau : cases, murs, bord, blocage
│   │   ├── gnome.js        Gnome : position, direction, rotations, case devant/derrière
│   │   ├── cards.js        Catalogue des cartes + création d'instances
│   │   ├── program.js      Algorithme en arbre : ajout, suppression, limite de 5 cartes
│   │   └── interpreter.js  Exécution : renvoie la liste des étapes, sans animation
│   └── ui/             AFFICHAGE : lit la logique, ne la modifie jamais
│       ├── boardView.js    Dessin de la grille, toucher sur une case
│       ├── paletteView.js  Palette des cartes + filtre par niveau
│       ├── programView.js  Arbre de l'algorithme, compteur, surlignage
│       ├── controls.js     Modes de la barre d'outils + boutons
│       └── animator.js     Lecture des étapes (auto / pas à pas) + message final
├── assets/icons/       Icônes SVG (gnome, mur, trésor)
└── tests/              Tests node:test
```

### Principes

- **Logique et affichage séparés.** `js/logic/` n'utilise ni `document` ni `window`. `js/ui/` affiche et transmet les actions de l'utilisateur à `main.js`, qui met à jour la logique puis redessine.
- **L'interpréteur ne fait pas d'animation.** `runProgram()` calcule toutes les étapes d'un coup (`{ gnome, cardUid, event }`). `animator.js` les rejoue ensuite avec `ANIMATION_DELAY_MS` entre chaque.
- **Constantes et textes centralisés** dans `config.js` et `i18n.js`.
- **Obstacles futurs** (terrier, racine, râteau) : les types existent déjà dans `CELL_TYPES` (`config.js`), leurs styles dans `board.css`, et leur effet se code dans `applyCellEffect()` (`interpreter.js`).

### Ajouter une carte

1. Ajouter son id dans `CARD_IDS` et sa définition dans `CARD_CATALOGUE` (`js/logic/cards.js`).
2. Ajouter son libellé dans `TEXTS.cards` (`js/i18n.js`).
3. Si elle utilise une nouvelle `action`, écrire son handler dans `interpreter.js` et l'ajouter à `CARD_HANDLERS`.
