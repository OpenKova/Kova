import type { FirstRunCopy } from './types_first_run'

export const frFirstRun: FirstRunCopy = {
  account: {
    title: 'Créer votre compte Kova',
    description: 'Utilisez Google pour créer un profil Kova et choisir un nom d’utilisateur. Cette connexion est distincte de celle d’un fournisseur de modèles d’IA.',
    privacy: 'Votre identité Kova, votre e-mail et votre nom d’utilisateur sont synchronisés entre vos appareils. Les discussions, l’accès aux modèles et les profils d’agents restent sur cet appareil.',
    signIn: 'Continuer avec Google',
    username: 'Choisir un nom d’utilisateur',
    usernamePlaceholder: 'votre_nom',
    usernameHint: '3 à 24 lettres, chiffres ou tirets bas. Les noms d’utilisateur sont uniques.',
    saveUsername: 'Enregistrer le nom',
    continue: 'Continuer la configuration',
    notNow: 'Pas maintenant',
    working: 'Traitement…',
    signOut: 'Se déconnecter',
    unavailable: 'La création d’un compte Kova n’est pas encore disponible dans cette version.'
  },
  beats: {
    name: 'Nom',
    theme: "Couleur d'accent",
    layout: 'Disposition',
    connectors: 'Applications',
    plugins: 'Plugins',
    tour: 'Visite',
    build: 'Première tâche'
  },
  namePlaceholder: 'Votre nom',
  useName: name => `Utiliser « ${name} »`,
  install: 'Installer',
  installed: 'Installé',
  loading: 'Chargement…',
  noPlugins: 'Aucun plugin à afficher pour le moment.',
  noneChosen: 'Aucun',
  noAnswer: 'Pas de réponse',
  answerRefused: 'Réponse non acceptée',
  tours: {
    quick: 'Visite rapide',
    full: 'Montre-moi tout',
    skip: 'Passer, construisons quelque chose'
  },
  skippedAll: 'Configuration ignorée',
  skip: 'Ignorer la configuration',
  skipTip: 'Termine la configuration guidée et ouvre une nouvelle discussion.',
  skipFailed: 'Impossible d’ignorer la configuration',
  slashOffTitle: 'Les commandes slash sont désactivées pendant la configuration',
  slashOffBody: 'Elles fonctionneront normalement une fois la configuration terminée.',
  localModel: {
    title: 'Cet ordinateur peut exécuter un modèle en local',
    text: (model, size) =>
      `${model} (${size}) convient à votre matériel. Il fonctionne gratuitement et vos conversations restent sur cet ordinateur.`,
    setUp: 'Le configurer',
    notNow: 'Pas maintenant'
  },
  intro: {
    greeting: 'Bonjour, je suis Kova.',
    plan: 'Configurons tout pour vous. Ensuite, nous ferons quelque chose de génial.'
  },
  rerun: {
    title: "Relancer l'accueil",
    description: 'Ouvre un nouveau chat de configuration qui reprend les premières étapes avec votre modèle actuel.',
    action: 'Relancer',
    failed: "Impossible de lancer l'accueil"
  }
}
