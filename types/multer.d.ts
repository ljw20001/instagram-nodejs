import 'multer';

declare module 'multer' {
  interface Options {
    fileFilter?: (req: Express.Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => void;
  }
}