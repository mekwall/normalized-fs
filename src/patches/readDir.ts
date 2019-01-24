import orgFs from 'fs';
import { fixer } from '../utils/fixer';
import { enqueue, retry } from '../queue';

export const patchReadDir = (fs: typeof orgFs) => {
  const fs$readdir = fs.readdir;
  fs.readdir = fixer(fs, fs.readdir, function readdir(
    path: orgFs.PathLike,
    options: any,
    callback: (err: NodeJS.ErrnoException) => void
  ) {
    const args: any[] = [path];
    if (typeof options !== 'function') {
      args.push(options);
    } else {
      callback = options;
    }
    args.push(go$readdir$cb);
    return go$readdir(args);
    function go$readdir$cb(err: NodeJS.ErrnoException, files?: string[]) {
      if (files && files.sort) {
        files.sort();
      }
      if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) {
        enqueue([go$readdir, [args]]);
      } else {
        if (typeof callback === 'function') {
          callback.apply(fs, arguments as any);
        }
        retry();
      }
    }
  });

  function go$readdir(args: any) {
    return fs$readdir.apply(fs, args);
  }
};
