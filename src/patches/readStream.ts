import orgFs from 'fs';
import { fixer } from '../utils/fixer';

declare module 'fs' {
  let FileReadStream: ReadStream;
}

export const patchReadStream = (fs: typeof orgFs) => {
  class ReadStream extends fs.ReadStream {
    open() {
      const { path, autoClose, flags, mode } = this as any;
      fs.open(path, flags, mode, (err, fd) => {
        if (err) {
          if (autoClose) this.destroy();
          this.emit('error', err);
        } else {
          (this as any).fd = fd;
          this.emit('open', fd);
          this.read();
        }
      });
    }
  }

  fs.createReadStream = fixer(
    fs,
    fs.createReadStream,
    (path: orgFs.PathLike, options: any) => {
      // Typings are wrong
      return new (ReadStream as any)(path, options);
    }
  );

  // if (process.version.substr(0, 4) === 'v0.8') {
  //   const legStreams = legacy(fs);
  //   ReadStream = legStreams.ReadStream;
  // }

  // Legacy name.
  fs.FileReadStream = ReadStream as any;
};
