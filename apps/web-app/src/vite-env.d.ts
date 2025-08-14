/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly MODE: string
  readonly PROD: boolean
  readonly SSR: boolean
  readonly VITE_API_URL?: string
  // Define custom env variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
