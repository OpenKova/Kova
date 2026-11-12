import type { FirstRunCopy } from './types_first_run'

export const esFirstRun: FirstRunCopy = {
  account: {
    title: 'Crea tu cuenta de Kova',
    description: 'Usa Google para crear un perfil de Kova y elegir un nombre de usuario. Es independiente del inicio de sesión de tu proveedor de modelos de IA.',
    privacy: 'Tu identidad de Kova, correo y nombre de usuario se sincronizan entre dispositivos. Los chats, el acceso a modelos y los perfiles de agentes permanecen en este dispositivo.',
    signIn: 'Continuar con Google',
    username: 'Elige un nombre de usuario',
    usernamePlaceholder: 'tu_nombre',
    usernameHint: 'Usa entre 3 y 24 letras, números o guiones bajos. Los nombres de usuario son únicos.',
    saveUsername: 'Guardar nombre de usuario',
    continue: 'Continuar con la configuración',
    notNow: 'Ahora no',
    working: 'Procesando…',
    signOut: 'Cerrar sesión',
    unavailable: 'La configuración de la cuenta de Kova aún no está disponible en esta versión.'
  },
  beats: {
    name: 'Nombre',
    theme: 'Color de acento',
    layout: 'Diseño',
    connectors: 'Apps',
    plugins: 'Plugins',
    tour: 'Recorrido',
    build: 'Primera tarea'
  },
  namePlaceholder: 'Tu nombre',
  useName: name => `Usar «${name}»`,
  install: 'Instalar',
  installed: 'Instalado',
  loading: 'Cargando…',
  noPlugins: 'No hay plugins para mostrar ahora mismo.',
  noneChosen: 'Ninguno',
  noAnswer: 'Sin respuesta',
  answerRefused: 'Respuesta no aceptada',
  tours: {
    quick: 'Recorrido rápido',
    full: 'Muéstramelo todo',
    skip: 'Omitir, construyamos algo'
  },
  skippedAll: 'Configuración omitida',
  skip: 'Omitir configuración',
  skipTip: 'Termina la configuración guiada y abre un chat nuevo.',
  skipFailed: 'No se pudo omitir la configuración',
  slashOffTitle: 'Los comandos con barra no están disponibles durante la configuración',
  slashOffBody: 'Funcionarán con normalidad cuando termine la configuración.',
  localModel: {
    title: 'Este ordenador puede ejecutar un modelo localmente',
    text: (model, size) =>
      `${model} (${size}) encaja con tu hardware. Funciona gratis y tus chats se quedan en este ordenador.`,
    setUp: 'Configurarlo',
    notNow: 'Ahora no'
  },
  intro: {
    greeting: 'Hola, soy Kova.',
    plan: 'Vamos a dejarlo todo listo para ti. Luego haremos algo genial.'
  },
  rerun: {
    title: 'Repetir la configuración inicial',
    description: 'Abre un nuevo chat de configuración que recorre los primeros pasos con tu modelo actual.',
    action: 'Repetir',
    failed: 'No se pudo iniciar la configuración inicial'
  }
}
