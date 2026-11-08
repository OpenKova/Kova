import type { TranslationOverrides } from './define-locale'

// The boot screen's copy (including the update-hold screen), composed by es.ts.
export const esBoot = {
  boot: {
    ready: 'Kova Desktop está listo',
    desktopBootFailedWithMessage: message => `Falló el arranque del escritorio: ${message}`,
    steps: {
      connectingGateway: 'Conectando el gateway de escritorio en vivo',
      loadingSettings: 'Cargando la configuración de Kova',
      loadingSessions: 'Cargando sesiones recientes',
      retryingRemoteBackend: 'Reconectando al backend remoto de Kova…',
      startingDesktopConnection: 'Iniciando la conexión de escritorio',
      startingKovaDesktop: 'Iniciando Kova Desktop…'
    },
    errors: {
      backgroundExited:
        'El servicio que ejecuta tus chats se cerró de forma inesperada. Reinícialo para continuar; tus chats y ajustes están a salvo.',
      backgroundExitedDuringStartup: 'Kova se detuvo justo después de iniciarse.',
      backendStopped: 'Kova dejó de funcionar en segundo plano',
      restartKova: 'Reiniciar Kova',
      openLogs: 'Abrir registros',
      desktopBootFailed: 'Kova no pudo iniciarse',
      gatewayConnectionLost: 'Kova perdió la conexión',
      gatewayConnectionLostDetail:
        'Seguimos intentando reconectar. Puedes seguir leyendo y escribiendo borradores. Si continúa, reconecta ahora o revisa los ajustes de conexión.',
      reconnectNow: 'Reconectar ahora',
      connectionSettings: 'Configuración de conexión',
      gatewaySignInRequired: 'Tu Kova remoto cerró tu sesión',
      gatewaySignInRequiredDetail: 'Vuelve a iniciar sesión para reconectar. Tus chats y ajustes están a salvo.',
      signInAgain: 'Volver a iniciar sesión',
      ipcBridgeUnavailable: 'Kova Desktop no pudo comunicarse con su propia capa en segundo plano. Reinicia la app.'
    },
    causes: {
      exitedEarly: 'El servicio en segundo plano de Kova se detuvo justo después de iniciarse.',
      timedOut: 'El servicio en segundo plano de Kova no respondió a tiempo.',
      permission: 'Kova no pudo escribir en su carpeta de datos (problema de permisos).',
      diskFull: 'El disco está lleno, así que Kova no pudo iniciarse.',
      portInUse: 'Otro programa está usando el puerto de red que necesita Kova.',
      installMissing: 'Falta parte de la instalación de Kova. Elige Reparar instalación para restaurarla.'
    },
    failure: {
      title: 'Kova no pudo iniciarse',
      description:
        'El servicio en segundo plano de Kova no arrancó. Prueba uno de los pasos de recuperación de abajo. Nada de esto elimina tus chats ni tus ajustes.',
      details: 'Detalles',
      remoteTitle: 'Se requiere iniciar sesión en el gateway remoto',
      remoteDescription:
        'Tu sesión del gateway remoto caducó. Inicia sesión de nuevo para reconectar. Esto no elimina tus chats ni tu configuración.',
      retry: 'Reintentar',
      repairInstall: 'Reparar instalación',
      useLocalGateway: 'Usar gateway local',
      gatewaySettings: 'Configuración del gateway',
      back: 'Atrás',
      openLogs: 'Abrir registros',
      repairHint: 'La reparación vuelve a ejecutar el instalador y puede tardar unos minutos en una máquina nueva.',
      remoteSignInHint: signInLabel =>
        `Cierra la sesión guardada del navegador remoto y abre ${signInLabel}. Usa el gateway local para cambiar al backend incluido.`,
      signOutAndSignIn: 'Cerrar sesión e iniciar sesión',
      remoteFailureHint: 'Revisa la URL e inicia sesión en Configuración del gateway, o cambia al gateway local.',
      cloudDownTitle: 'El agente de Nous Cloud no está disponible',
      cloudDownDescription:
        'El agente en la nube administrado por Nous al que se conecta este gateway devuelve un error de servidor. No se puede reiniciar desde aquí: revisa su estado, cambia al gateway local o pide ayuda.',
      cloudDownHint:
        'Los botones de abajo abren el Neural Studio Portal (estado y controles de la instancia) y nuestro Discord para obtener ayuda.',
      cloudDownCheckPortal: 'Ver el estado en el Portal',
      cloudDownDiscord: 'Pedir ayuda en Discord',
      hideRecentLogs: 'Ocultar registros recientes',
      showRecentLogs: 'Mostrar registros recientes',
      signedInTitle: 'Sesión iniciada',
      signedInMessage: 'Reconectando con el gateway remoto…',
      signInIncompleteTitle: 'Inicio de sesión incompleto',
      signInIncompleteMessage: 'La ventana de inicio de sesión se cerró antes de que terminara la autenticación.',
      signInFailed: 'No se pudo iniciar sesión',
      signInToRemoteGateway: 'Iniciar sesión en el gateway remoto',
      signInWithProvider: provider => `Iniciar sesión con ${provider}`,
      identityProvider: 'tu proveedor de identidad'
    },
    updateHold: {
      title: 'Una actualización anterior todavía retiene Kova',
      titleUnverified: 'Kova no puede confirmar que la última actualización terminó',
      description:
        'Kova espera antes de iniciar para no cargar archivos que una actualización quizá todavía esté cambiando. Se inicia solo en cuanto termine la retención.',
      heldByProcess: pid =>
        `La actualización (proceso ${pid}) terminó, pero un proceso que inició todavía retiene la instalación de Kova.`,
      heldUnknown: 'Una actualización terminó, pero un proceso que inició todavía retiene la instalación de Kova.',
      unverified:
        'El asistente de actualización no pudo comprobar quién tiene la instalación de Kova. Kova sigue comprobando.',
      since: time => `Esperando desde ${time}`,
      lastChecked: time => `Última comprobación ${time}`,
      recoveryHint:
        'Esto suele resolverse en unos minutos. Si no: cierra Kova, termina los procesos git o hermes que queden (o reinicia el equipo) y vuelve a abrir Kova.',
      checkAgain: 'Comprobar de nuevo',
      quit: 'Salir de Kova',
      openLogs: 'Abrir registros',
      startAnyway: 'Iniciar de todos modos…',
      confirmTitle: '¿Iniciar Kova mientras la actualización todavía lo retiene?',
      confirmBody:
        'El proceso de actualización restante quizá siga cambiando archivos de Kova. Iniciar ahora puede cargar una instalación a medio actualizar, que puede no funcionar hasta que vuelvas a ejecutar la actualización. Kova registra esta decisión y deja el marcador de actualización en su lugar.',
      confirmKeepWaiting: 'Seguir esperando',
      confirmStart: 'Iniciar de todos modos',
      startAnywayRefused:
        'Lo que retiene la instalación cambió antes de que Kova pudiera iniciar. Revísalo e inténtalo de nuevo.'
    }
  }
} satisfies Pick<TranslationOverrides, 'boot'>
