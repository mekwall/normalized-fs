import orgFs from 'fs';
import { fixer } from '../utils/fixer';
import { enqueue, retry } from '../queue';

export const patchWriteFile = (fs: typeof orgFs) => {
  const fs$writeFile = fs.writeFile;
  fs.writeFile = fixer<typeof fs.writeFile>(
    fs,
    fs.writeFile,
    function writeFile(
      path: orgFs.PathLike,
      data: any,
      options: any,
      callback: (err: NodeJS.ErrnoException) => void
    ) {
      if (typeof options === 'function') {
        callback = options;
        options = null;
      }
      return doWriteFile(path, data, options, callback);
      function doWriteFile(
        path: orgFs.PathLike,
        data: any,
        options: any,
        callback: (err: NodeJS.ErrnoException) => void
      ) {
        return fs$writeFile(path, data, options, function(err) {
          if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) {
            enqueue([writeFile, [path, data, options, callback]]);
          } else {
            if (typeof callback === 'function') {
              callback.apply(fs, arguments as any);
            }
            retry();
          }
        });
      }
    }
  );
};
