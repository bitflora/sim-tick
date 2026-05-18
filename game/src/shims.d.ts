declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const c: DefineComponent<{}, {}, any>;
  export default c;
}

interface ImportMetaEnv {
  readonly VITE_GRID_SIZE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
