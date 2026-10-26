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
  squareBookingUrl: "",

  // 2) Lien de paiement Square de 20 $ (utilisé seulement si
  //    squareBookingUrl est vide). Tableau de bord Square >
  //    Paiements en ligne > Liens de paiement > Créer un lien (montant fixe 20 $).
  squareDepositLink: "",

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
     price : texte affiché (ex. "dès 120 $"). Laisser "" pour masquer. */
  catalogue: {
    femmes: {
      label: "Femmes",
      styles: [
        { name: "Knotless braids", price: "" },
        { name: "Box braids", price: "" },
        { name: "Twists", price: "" },
        { name: "Cornrows", price: "" },
        { name: "Demi-rasta", price: "" },
        { name: "Chignon avec frontal", price: "" },
        { name: "Défaire les tresses", price: "" }
      ]
    },
    enfants: {
      label: "Enfants",
      styles: [
        { name: "Tresses simples", price: "" },
        { name: "Cornrows (tresses collées)", price: "" },
        { name: "Tresses avec rajouts", price: "" },
        { name: "Twists (vanilles)", price: "" },
        { name: "Box braids", price: "" },
        { name: "Coiffure avec perles", price: "" },
        { name: "Freestyle", price: "" }
      ]
    },
    hommes: {
      label: "Hommes",
      styles: [
        { name: "Tresses (braids)", price: "" },
        { name: "Cornrows", price: "" },
        { name: "Freestyle", price: "" },
        { name: "Box braids", price: "" },
        { name: "Tresses avec rajouts", price: "" },
        { name: "Twists (vanilles)", price: "" },
        { name: "Locks (dreads)", price: "" }
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
