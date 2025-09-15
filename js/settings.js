window.APP_SETTINGS = {
  APPLY_RETROACTIVE: true, // retroactivo mensual (confirmado)
  FIREBASE: {
    // Rellena con tu proyecto
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",
    appId: "TU_APP_ID",
    // HTTPS Callable/HTTP Function URL para enviar correos:
    emailFunctionUrl:
      "https://us-central1-TU_PROYECTO.cloudfunctions.net/sendReport",
  },
};
