# SK Beauty — site statique (HTML/CSS/JS + Square)

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil : salon, coiffures, réservation, réalisations, boutique, contact |
| `rendez-vous.html` | Formulaire de prise de rendez-vous détaillé |
| `conditions.html`, `confidentialite.html` | Pages légales (modèles à compléter, passages surlignés) |
| `assets/js/config.js` | **Seul fichier à modifier** : liens Square, prix, horaires, catalogue |
| `api/send-booking.php` | Envoie la demande au salon (photo en pièce jointe) et une confirmation à la cliente |
| `assets/img/` | Images de remplacement : à remplacer par les vraies photos, **mêmes noms de fichiers** |
| `.htaccess` | HTTPS, redirections des anciennes URL WordPress, cache, sécurité |

## Fonctionnement de la réservation

1. La cliente choisit la coiffure, la longueur, la grosseur, les mèches et les options.
2. Elle donne ses coordonnées (+ photo d'inspiration facultative).
3. La demande détaillée part par courriel au salon (référence `SK-AAMMJJ-XXXX`).
4. Paiement des 20 $ et créneau via Square, selon `config.js` :
   - **`squareBookingUrl` rempli (recommandé)** : la cliente choisit son créneau en temps réel sur Square Appointments et paie les 20 $ (prépaiement Square). L'étape « Date & heure » du site disparaît.
   - **Sinon `squareDepositLink` rempli** : la cliente choisit un jour/heure souhaité sur le site, puis paie 20 $ via un lien de paiement Square. Le salon confirme le créneau.
   - **Aucun lien** : la demande est envoyée et le salon recontacte la cliente.

## Configurer Square

- **Square Appointments** : Tableau de bord > Rendez-vous > Réservation en ligne > Canaux > « Ajouter votre réservation à un site existant » > *Obtenir l'URL* → coller dans `squareBookingUrl`. Activer la politique de prépaiement de 20 $ dans les paramètres de réservation.
- **Lien de paiement 20 $** : Tableau de bord > Paiements en ligne > Liens de paiement > Créer (montant fixe) → `squareDepositLink`.
- **Boutique** : un lien de paiement par produit → `squareProductLinks.huile` / `.chantilly`. Sans lien, le bouton affiche « Disponible au salon ».

## Déploiement sur Obambu (cPanel)

1. Sauvegarder l'ancien site WordPress (cPanel > Sauvegarde), puis vider `public_html` (ou travailler d'abord dans un sous-domaine de test).
2. Téléverser le contenu de ce dossier dans `public_html` (Gestionnaire de fichiers > Téléverser le zip > Extraire). Vérifier que `.htaccess` est bien présent (fichiers cachés).
3. Créer l'adresse **noreply@skbeautysalon.com** dans cPanel > Comptes de messagerie (expéditeur des courriels). Ajuster `SALON_EMAIL` dans `api/send-booking.php` si les demandes doivent arriver ailleurs.
4. Faire une réservation test et vérifier la réception (et les indésirables). Si les courriels arrivent en indésirable, activer SPF/DKIM dans cPanel > Délivrabilité des courriels.

## À compléter avant la mise en ligne

- [ ] Vraies photos dans `assets/img/` (mêmes noms, JPG, ~1200 px max)
- [ ] Prix dans `config.js` (`price: "dès 120 $"`)
- [ ] Ville, code postal, heures d'ouverture : `index.html` (section Contact + bloc JSON-LD en haut)
- [ ] Carte Google Maps : remplacer l'`iframe` par le code « Intégrer une carte » de Google Maps
- [ ] Lien Instagram : `instagramUrl` dans `config.js`
- [ ] Liens Square dans `config.js`
- [ ] Textes des conditions et de la politique de confidentialité (Loi 25)
- [ ] Soumettre `sitemap.xml` dans Google Search Console
