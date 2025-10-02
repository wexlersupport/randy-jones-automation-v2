// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui-pro',
    '@vueuse/nuxt',
    '@formkit/nuxt',
    'nuxt-pdfmake',
  ],
  pdfmake: {
    enabled: true, // Enable the module
    enableComposable: true, // Enable usePDFMake and useFontPresets composables
    enableDevtools: true, // Enable the devtools tab
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/api/**': {
      cors: true
    }
  },

  future: {
    compatibilityVersion: 4
  },

  compatibilityDate: '2024-07-11',

  formkit: {
    // Experimental support for auto loading (see note):
    autoImport: true
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  runtimeConfig: {
    public: {
      openrouterApiKey: process.env.NUXT_PUBLIC_OPENROUTER_API_KEY,
      zoomAccountId: process.env.NUXT_PUBLIC_ZOOM_ACCOUNT_ID,
      zoomClientId: process.env.NUXT_PUBLIC_ZOOM_CLIENT_ID,
      zoomClientSecret: process.env.NUXT_PUBLIC_ZOOM_CLIENT_SECRET,
      onedriveTenantId: process.env.NUXT_PUBLIC_ONEDRIVE_TENANT_ID,
      onedriveAccountId: process.env.NUXT_PUBLIC_ONEDRIVE_ACCOUNT_ID,
      onedriveClientSecret: process.env.NUXT_PUBLIC_ONEDRIVE_CLIENT_SECRET,
      pipedriveApiKey: process.env.NUXT_PUBLIC_PIPEDRIVE_API_KEY,
      googlePrivateKey: process.env.NUXT_PUBLIC_GOOGLE_PRIVATE_KEY,
      sendgridApiKey: process.env.NUXT_PUBLIC_SENDGRID_API_KEY,
      convertapiSecretKey: process.env.NUXT_PUBLIC_CONVERTAPI_SECRET_KEY,
      openaiApiKey: process.env.NUXT_PUBLIC_OPENAI_API_KEY,
    },
  }
})
