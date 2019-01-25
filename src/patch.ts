import * as orgFs from 'fs';
import * as constants from 'constants';
import { patchProcess } from './patches/process';
import { patchLchmod } from './patches/lchmod';
import { patchLutimes } from './patches/lutimes';
import { patchChown } from './patches/chown';
import { patchRename } from './patches/rename';
import { patchRead } from './patches/read';
import { patchReadFile } from './patches/readFile';
import { patchWriteFile } from './patches/writeFile';
import { patchReadDir } from './patches/readDir';
import { patchOpen } from './patches/open';
import { patchReadStream } from './patches/readStream';
import { patchWriteStream } from './patches/writeStream';
import { patchChmod } from './patches/chmod';
import { patchAppendFile } from './patches/appendFile';
import { patchStat } from './patches/stat';

declare module 'fs' {
  let __patched: boolean;
  let normalize: typeof patch;
}

const __TEST__ = !!process.env.NFS_INTERNAL_TEST;

export const patch = (fs: typeof orgFs) => {
  // (re-)implement some things that are known busted or missing.
  patchProcess(process);

  // lchmod, broken prior to 0.6.2
  // back-port the fix here.
  if (
    __TEST__ ||
    (constants.hasOwnProperty('O_SYMLINK') &&
      process.version.match(/^v0\.6\.[0-2]|^v0\.5\./))
  ) {
    patchLchmod(fs);
  }

  // lutimes implementation, or no-op
  if (__TEST__ || !fs.lutimes) {
    patchLutimes(fs);
  }

  patchOpen(fs);
  patchStat(fs);
  patchChown(fs);
  patchChmod(fs);
  patchRename(fs);
  patchRead(fs);
  patchReadDir(fs);
  patchReadFile(fs);
  patchReadStream(fs);
  patchWriteFile(fs);
  patchWriteStream(fs);
  patchAppendFile(fs);

  fs.__patched = true;
  fs.normalize = patch;

  return fs;
};
