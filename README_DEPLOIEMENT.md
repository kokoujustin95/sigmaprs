# GS SIGMA — déploiement GitHub + Render (sans Google Apps Script)

## Contenu
- `index.html` : interface GS SIGMA et aides intégrées.
- `Guide_utilisateur_GS_SIGMA.pdf` : guide illustré téléchargeable et ouvrable depuis l’écran de connexion.
- `server.js` : serveur Node.js et API de synchronisation.
- `render.yaml` : configuration du service Render et de PostgreSQL.
- `sigma_logo.png` et `screenshots/` : ressources visuelles.

## Déploiement
1. Téléverse tous les fichiers de cette archive à la racine d’un dépôt GitHub.
2. Dans Render, crée un Blueprint depuis ce dépôt et vérifie la création du service Web et de la base PostgreSQL.
3. Attends la fin du déploiement puis vérifie `https://TON-SITE.onrender.com/api/health`. Le résultat attendu est `ok: true`.
4. Ouvre le site, clique sur « Aide et guide utilisateur », puis teste « Ouvrir le guide PDF » et « Télécharger le guide PDF ».
5. Vérifie l’interface sur un ordinateur et un téléphone.

## Aide et guide utilisateur
L’aide intégrée est autonome et ne dépend pas de Google Apps Script. Le guide PDF doit rester à la racine, avec le nom exact `Guide_utilisateur_GS_SIGMA.pdf`. Le serveur expose explicitement le fichier PDF avec le type MIME `application/pdf`. Si le téléchargement est bloqué, le bouton d’ouverture lance le PDF dans un nouvel onglet.

## Synchronisation et sécurité
Le serveur utilise PostgreSQL via `DATABASE_URL`. Avant d’utiliser le site avec des données réelles, l’authentification et les permissions doivent être sécurisées côté serveur. Ne publie pas de mots de passe réels dans un service dont l’API de base partagée est encore ouverte. Les données sauvegardées uniquement dans le stockage local d’un ancien navigateur ne sont pas importées automatiquement : exporte-les et importe-les via les fonctions prévues, si disponibles.


## Correction PDF introuvable
Le guide est servi par trois adresses : `/Guide_utilisateur_GS_SIGMA.pdf`, `/guide-utilisateur.pdf` et `/guide.pdf`. Le fichier `Guide_utilisateur_GS_SIGMA.pdf` doit être placé dans le même dossier que `server.js`, `package.json` et `index.html` (racine du service Render). Dans GitHub, téléverse le CONTENU du dossier du projet, pas le dossier parent lui-même. Après le déploiement, teste directement `https://TON-SITE.onrender.com/guide.pdf`. Une réponse PDF doit s'afficher, pas une page HTML.

## Page 404 et mode maintenance
- `404.html` est la page de secours affichée lorsqu'une adresse du site n'existe pas (HTTP 404). Elle explique à l'utilisateur que la page est introuvable.
- Pour afficher cette page comme message de maintenance à tous les visiteurs, ouvre Render → service Web → Environment, ajoute `MAINTENANCE_MODE` avec la valeur `true`, puis redéploie/redémarre le service. Le site renverra alors HTTP 503 et conservera `/api/health` accessible pour le contrôle technique.
- Pour remettre le site en service, change `MAINTENANCE_MODE` en `false` ou supprime cette variable, puis redémarre le service.
- La page est autonome et ne dépend d'aucune image ni ressource externe.

## Mise à jour — choix des UE et accès Wi-Fi campus
- Le menu **Choix des UE (étudiants)** est placé dans la section Gestion et reste accessible aux comptes étudiants/utilisateurs. Ils peuvent cocher leurs UE, enregistrer leur sélection et exporter le récapitulatif PDF.
- Les paramètres officiels du catalogue et la limite officielle de crédits restent réservés à l’administration dans l’interface.
- Dans **Administration → Comptes utilisateurs → Modifier**, l’administrateur peut renseigner l’identifiant et le mot de passe Wi-Fi attribués par l’école/campus.
- Chaque utilisateur retrouve ces informations dans **Mon compte / Wi-Fi campus**. Il peut les afficher ou copier les identifiants, mais pas les modifier.

**Sécurité importante :** dans cette version, l’application synchronise encore une partie importante des données au moyen d’un état partagé côté navigateur. Les contrôles de rôle de l’interface ne constituent donc pas à eux seuls une protection serveur suffisante pour des secrets Wi-Fi réels. Avant d’y saisir les vrais mots de passe du campus, il faut renforcer l’API avec une authentification serveur et des autorisations par rôle/compte, afin qu’un utilisateur ne puisse jamais télécharger les identifiants des autres.
