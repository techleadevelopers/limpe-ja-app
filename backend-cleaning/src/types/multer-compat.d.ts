import type { Express } from 'express';

// Compatibility layer to bridge common, but incorrect, type imports/usages of Multer
// across the codebase. New code should prefer `Express.Multer.File` directly.
declare module 'multer' {
  // Allow `import { File } from 'multer'` to work as a type-only alias
  // for the canonical Express Multer file type.
  export type File = Express.Multer.File;

  // Allow usages like `Multer.File` in type positions
  // when importing `import { Multer } from 'multer'`.
  export namespace Multer {
    // Mirror the Express.Multer.File shape
    export interface File extends Express.Multer.File {}
  }
}
