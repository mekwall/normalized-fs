import orgFs from 'fs';
import { fixer } from '../utils/fixer';
import { enqueue, retry } from '../queue';

export const patchAppendFile = (fs: typeof orgFs) => {
  const fs$appendFile = fs.appendFile;
  fs.appendFile = fixer(fs, fs.appendFile, function(
    path: orgFs.PathLike,
    data: any,
    options: any,
    callback: (err: NodeJS.ErrnoException) => void
  ) {
    if (typeof options === 'function') {
      callback = options;
      options = null;
    }
    return go$appendFile(path, data, options, callback);
    function go$appendFile(
      path: orgFs.PathLike,
      data: any,
      options: any,
      callback: (err: NodeJS.ErrnoException) => void
    ) {
      return fs$appendFile(path, data, options, function(err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) {
          enqueue([go$appendFile, [path, data, options, callback]]);
        } else {
          if (typeof callback === 'function')
            callback.apply(fs, arguments as any);
          retry();
        }
      });
    }
  });
};
