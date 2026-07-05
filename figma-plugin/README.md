# Orbit Atlas - Figma Plugin

Ce plugin Figma injecte le contenu genere par le workflow Orbit Atlas (textes et images) dans les layers nommes du fichier Figma, puis exporte les slides finales et notifie le workflow.

## Installation (mode developpement)

Cloner ou telecharger ce depot en local. Ouvrir l'application Figma en mode desktop, car le mode developpement plugin ne fonctionne pas dans le navigateur. Aller dans le menu Plugins puis Development puis Import plugin from manifest. Selectionner le fichier figma-plugin/manifest.json de ce depot clone en local. Le plugin apparait ensuite dans la liste de vos plugins personnels, utilisable sur n'importe quel fichier Figma.

## Configuration requise

Avant utilisation, ouvrir figma-plugin/code.ts et remplacer la constante ORBIT_API_BASE par l'URL reelle de votre application Orbit Atlas deployee sur Vercel. Mettre a jour egalement figma-plugin/manifest.json pour ajouter votre domaine dans la liste networkAccess.allowedDomains.

## Convention de nommage des layers Figma

Pour que le plugin puisse injecter le contenu correctement, chaque template Figma doit respecter cette convention. Le nom de la frame de slide doit correspondre exactement au champ figmaFrameName defini dans la base de donnees. Chaque layer de texte doit etre nomme SLOT_NOM_DU_SLOT, par exemple SLOT_TITRE_ACCROCHE. Chaque layer d'image doit etre nomme SLOT_IMAGE_1, SLOT_IMAGE_2, et ainsi de suite.

## Utilisation

Ouvrir le fichier Figma contenant le template dans lequel vous voulez injecter du contenu. Lancer le plugin Orbit Atlas Sync depuis le menu Plugins. Entrer l'identifiant du workflow dans le champ prevu. Cliquer sur le bouton de chargement pour injecter les textes et images. Faire les ajustements visuels souhaites directement dans Figma. Cliquer enfin sur le bouton de validation pour exporter les slides finales et notifier le workflow Orbit Atlas.

## Fichiers du plugin

Le fichier manifest.json contient la configuration du plugin: nom, permissions, acces reseau. Le fichier code.ts contient la logique principale qui s'execute dans le contexte Figma. Le fichier ui.html contient l'interface du plugin, le panneau visible dans Figma. Le fichier package.json contient les dependances de developpement, typescript et types Figma. Le fichier tsconfig.json contient la configuration TypeScript pour la compilation.
