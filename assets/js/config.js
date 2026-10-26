/* =========================================================
   SK Beauty — CONFIGURATION
   C'est le seul fichier à modifier pour les prix, les liens
   Square et les horaires. Voir README.md.
   ========================================================= */
window.SK_CONFIG = {

  /* ---------- SQUARE ---------- */

  // 1) Lien de réservation Square Appointments (recommandé).
  //    Tableau de bord Square > Rendez-vous > Réservation en ligne > Canaux
  //    > « Ajouter votre réservation à un site existant » > Obtenir l'URL.
  //    S'il est rempli : les vrais créneaux et le paiement des 20 $ se font
  //    sur Square (disponibilités en temps réel + politique de prépaiement).
  squareBookingUrl: "https://app.squareup.com/appointments/book/oyvjyq9ygr8iej/LXP82AAA01BKB/start",

  // 2) Lien de paiement Square de 20 $ (utilisé seulement si
  //    squareBookingUrl est vide). Tableau de bord Square >
  //    Paiements en ligne > Liens de paiement > Créer un lien (montant fixe 20 $).
  squareDepositLink: "https://square.link/u/401MXp2M",

  // 3) Liens de paiement Square pour la boutique (un lien par produit).
  squareProductLinks: {
    huile: "",
    chantilly: ""
  },

  /* ---------- RÉSERVATION ---------- */

  bookingFee: 20,

  // Utilisés seulement sans Square Appointments (mode lien de paiement).
  daysAhead: 21,              // nombre de jours proposés
  closedWeekdays: [],         // 0 = dimanche … 6 = samedi (vide = 7j/7)
  slots: ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00"],

  /* ---------- CATALOGUE ----------
     price : texte affiché (ex. "dès 120 $"). Laisser "" pour masquer. Prix en CAD. */
  catalogue: {
    femmes: {
      label: "Femmes",
      styles: [
        { name: "Knotless braids", price: "160 – 250 $" },
        { name: "Box braids · Tresses", price: "100 – 280 $" },
        { name: "Micro twists · Vanilles", price: "dès 150 $" },
        { name: "Cornrows · Tresses collées", price: "dès 80 $" },
        { name: "Demi-rasta", price: "dès 150 $" },
        { name: "Chignon avec frontal", price: "dès 100 $" },
        { name: "Défaire les tresses", price: "dès 40 $" },
        { name: "Pose de perruque", price: "50 $" },
        { name: "Resserrage de micro locs", price: "100 – 200 $" },
        { name: "Resserrage de locs", price: "150 $" }
      ]
    },
    enfants: {
      label: "Enfants",
      styles: [
        { name: "Tresses simples", price: "dès 40 $" },
        { name: "Cornrows (tresses collées)", price: "dès 50 $" },
        { name: "Tresses avec rajouts", price: "dès 80 $" },
        { name: "Twists (vanilles)", price: "dès 70 $" },
        { name: "Box braids", price: "dès 80 $" },
        { name: "Coiffures avec perles", price: "dès 50 $" },
        { name: "Freestyle", price: "dès 60 $" }
      ]
    },
    hommes: {
      label: "Hommes",
      styles: [
        { name: "Tresses (braids)", price: "dès 60 $" },
        { name: "Cornrows", price: "dès 60 $" },
        { name: "Freestyle", price: "dès 75 $" },
        { name: "Box braids", price: "dès 100 $" },
        { name: "Tresses avec rajouts", price: "dès 80 $" },
        { name: "Twists (vanilles)", price: "dès 75 $" },
        { name: "Locks (dreads)", price: "dès 100 $" }
      ]
    }
  },

  lengths: ["Courte", "Épaules", "Mi-dos", "Taille", "Longue (fesses)"],
  sizes: ["Petites", "Moyennes", "Grosses"],
  hairOptions: [
    { label: "Fournies par le salon", sub: "Supplément selon la coiffure" },
    { label: "J'apporte mes mèches", sub: "Quantité confirmée par le salon" },
    { label: "Sans rajouts", sub: "Sur cheveux naturels" }
  ],
  extras: ["Défaire mes tresses actuelles", "Ajout de perles ou accessoires"],

  /* ---------- RÉSEAUX ---------- */
  instagramUrl: ""
};
