import orgFs from 'fs';

function statFix<T extends any>(fs: typeof orgFs, orig: T): T {
  if (!orig) return orig;
  // Older versions of Node erroneously returned signed integers for
  // uid + gid.
  const newFunc: any = function(
    path: orgFs.PathLike,
    callback: (err: NodeJS.ErrnoException) => void
  ) {
    return orig.call(fs, path, function(
      _e: NodeJS.ErrnoException,
      stats: orgFs.Stats
    ) {
      if (!stats) return callback.apply(fs, arguments as any);
      if (stats.uid < 0) stats.uid += 0x100000000;
      if (stats.gid < 0) stats.gid += 0x100000000;
      if (callback) callback.apply(fs, arguments as any);
    });
  };
  return newFunc as T;
}

function statSyncFix<T extends any>(fs: typeof orgFs, orig: T): T {
  if (!orig) return orig;
  // Older versions of Node erroneously returned signed integers for
  // uid + gid.
  const newFunc: any = function(path: orgFs.PathLike) {
    var stats = orig.call(fs, path);
    if (stats.uid < 0) stats.uid += 0x100000000;
    if (stats.gid < 0) stats.gid += 0x100000000;
    return stats;
  };
  return newFunc as T;
}

export const patchStat = (fs: typeof orgFs) => {
  fs.stat = statFix(fs, fs.stat);
  fs.statSync = statSyncFix(fs, fs.statSync);

  fs.fstat = statFix(fs, fs.fstat);
  fs.fstatSync = statSyncFix(fs, fs.fstatSync);

  fs.lstat = statFix(fs, fs.lstat);
  fs.lstatSync = statSyncFix(fs, fs.lstatSync);
};
