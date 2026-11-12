import type { FirstRunCopy } from './types_first_run'

export const enFirstRun: FirstRunCopy = {
  account: {
    title: 'Create your Kova account',
    description: 'Use Google to set up a Kova profile and choose a username. This is separate from signing in to an AI model provider.',
    privacy: 'Your Kova identity, email, and username sync across devices. Chats, model access, and agent profiles stay on this device.',
    signIn: 'Continue with Google',
    username: 'Choose a username',
    usernamePlaceholder: 'your_name',
    usernameHint: 'Use 3–24 letters, numbers, or underscores. Usernames are unique.',
    saveUsername: 'Save username',
    continue: 'Continue to setup',
    notNow: 'Not now',
    working: 'Working…',
    signOut: 'Sign out',
    unavailable: 'Kova account setup is not available in this build yet.'
  },
  beats: {
    name: 'Name',
    theme: 'Accent color',
    layout: 'Layout',
    connectors: 'Apps',
    plugins: 'Plugins',
    tour: 'Tour',
    build: 'First task'
  },
  namePlaceholder: 'Your name',
  useName: name => `Use “${name}”`,
  install: 'Install',
  installed: 'Installed',
  loading: 'Loading…',
  noPlugins: 'No plugins to show right now.',
  noneChosen: 'None',
  noAnswer: 'No answer',
  answerRefused: 'Answer not accepted',
  tours: {
    quick: 'Quick tour',
    full: 'Show me everything',
    skip: "Skip, let's build something"
  },
  skippedAll: 'Setup skipped',
  skip: 'Skip setup',
  skipTip: 'End the guided setup and open a new chat.',
  skipFailed: 'Could not skip setup',
  slashOffTitle: 'Slash commands are off during setup',
  slashOffBody: 'They work as usual once setup is done.',
  localModel: {
    title: 'This computer can run a model locally',
    text: (model, size) => `${model} (${size}) fits your hardware. It runs free, and your chats stay on this computer.`,
    setUp: 'Set it up',
    notNow: 'Not now'
  },
  intro: {
    greeting: "Hi, I'm Kova.",
    plan: "Let's set things up for you. Then we'll get something cool done."
  },
  rerun: {
    title: 'Run onboarding again',
    description: 'Open a new setup chat that walks through the first-run steps with your current model.',
    action: 'Run again',
    failed: 'Could not start onboarding'
  }
}
