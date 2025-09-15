// plugins/vue-quill.client.ts
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'; // Or vue-quill.bubble.css for bubble theme

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('QuillEditor', QuillEditor)
})