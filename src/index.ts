import orgFs from 'fs';
import { clone } from './utils/clone';
import { patch } from './patch';
import { retry } from './queue';
import { fixer } from './utils/fixer';

const PATCH_GLOBAL =
  process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !orgFs.__patched;

const fs = PATCH_GLOBAL ? patch(orgFs) : patch(clone(orgFs));

// Always patch fs.close/closeSync, because we want to
// retry() whenever a close happens *anywhere* in the program.
// This is essential when multiple normalized-fs instances are
// in play at the same time.
const fs$close = fs.close;
const close = fixer(fs, fs.close, function(
  fd: number,
  cb: (err: NodeJS.ErrnoException) => void
) {
  return fs$close.call(fs, fd, function(err: NodeJS.ErrnoException) {
    if (!err) {
      retry();
    }
    if (typeof cb === 'function') {
      cb.apply(fs, arguments as any);
    }
  });
});

const fs$closeSync = fs.closeSync;
const closeSync = fixer(fs, fs.closeSync, function(fd: number) {
  // Note that normalized-fs also retries when fs.closeSync() fails.
  // Looks like a bug to me, although it's probably a harmless one.
  var rval = fs$closeSync.apply(fs, arguments as any);
  retry();
  return rval;
});

// Only patch fs once, otherwise we'll run into a memory leak if
// normalized-fs is loaded multiple times, such as in test environments that
// reset the loaded modules between tests.
// We look for the string `normalized-fs` from the comment above. This
// way we are not adding any extra properties and it will detect if older
// versions of normalized-fs are installed.
if (!/\bnormalized-fs\b/.test(fs.closeSync.toString())) {
  fs.closeSync = closeSync;
  fs.close = close;
}

const exportedFs: typeof orgFs = { ...fs, close, closeSync };
export default exportedFs;
module.exports = exportedFs;
