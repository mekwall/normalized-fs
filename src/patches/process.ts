export const patchProcess = (process: NodeJS.Process) => {
  const origCwd = process.cwd;
  let cwd: any = null;
  process.cwd = function() {
    if (!cwd) cwd = origCwd.call(process);
    return cwd;
  };
  try {
    process.cwd();
  } catch (er) {}

  const orgChdir = process.chdir;
  process.chdir = function(d) {
    cwd = null;
    orgChdir.call(process, d);
  };
};
