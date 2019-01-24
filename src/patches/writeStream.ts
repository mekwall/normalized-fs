import orgFs from 'fs';
import { fixer } from '../utils/fixer';

declare module 'fs' {
  let FileWriteStream: WriteStream;
}

export const patchWriteStream = (fs: typeof orgFs) => {
  class WriteStream extends orgFs.WriteStream {
    open() {
      const { path, flags, mode } = this as any;
      fs.open(path, flags, mode, (err, fd) => {
        if (err) {
          this.destroy();
          this.emit('error', err);
        } else {
          (this as any).fd = fd;
          this.emit('open', fd);
        }
      });
    }
  }

  fs.createWriteStream = fixer(
    fs,
    fs.createWriteStream,
    (path: string | Buffer, options: any) => {
      // Typings are wrong
      return new (WriteStream as any)(path, options);
    }
  );

  if (process.version.substr(0, 4) === 'v0.8') {
    // var legStreams = legacy(fs);
    // WriteStream = legStreams.WriteStream;
  }

  // Legacy name.
  fs.FileWriteStream = WriteStream as any;
};
