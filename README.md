# normalized-fs

[![GitHub license](https://img.shields.io/badge/license-ISC-blue.svg?style=flat-square)](https://github.com/mekwall/normalized-fs/blob/master/LICENSE)
[![CircleCI Status](https://img.shields.io/circleci/project/github/mekwall/normalized-fs.svg?style=flat-square&logo=circleci)](https://circleci.com/gh/mekwall/normalized-fs)
[![AppVeyor Status](https://img.shields.io/appveyor/ci/mekwall/normalized-fs.svg?style=flat-square&logo=appveyor)](https://ci.appveyor.com/project/mekwall/normalized-fs)
[![Coverage](https://img.shields.io/codecov/c/github/mekwall/normalized-fs/master.svg?style=flat-square)](https://codecov.io/github/mekwall/normalized-fs?branch=master)
[![Dependencies](https://img.shields.io/librariesio/github/mekwall/normalized-fs.svg?style=flat-square)](https://github.com/mekwall/normalized-fs)

A drop-in replacement for `fs` that aims to normalize the behavior across different platforms and environments, and to make filesystem access more resilient to errors.

## Overall improvements over [fs module](https://nodejs.org/api/fs.html)

- Queues up open and readdir calls, and retries them once something closes if there is an EMFILE error from too many open file descriptors.
- Fixes broken lchmod for Node versions prior to 0.6.2.
- Implements fs.lutimes if possible, otherwise it becomes a no-op.
- Ignores EINVAL and EPERM errors in chown, fchown or lchown if the user isn't root.
- If lchmod and lchown are unavailable, they become no-ops.
- Retries reading a file if read results in EAGAIN error.

### Windows-specific improvements

> NOTE: Due to how Windows lock files based on usage we need to add some workarounds that makes these operations more resilient. The timeout used for these operations can be overridden with the `NFS_WIN32_TIMEOUT` env variable and is set to 5000 milliseconds as default.

- rename/renameSync: Retry a failed rename until timeout is reached if EACCESS or EPERM error occurs.
- unlink/unlinkSync: Ensure that file is seen as removed by Node before seen as suceeded/failed

## Installation

### npm

```bash
$ npm install normalized-fs
```

### yarn

```bash
$ yarn add normalized-fs
```

## Usage

```typescript
// import just like with fs
import fs from 'normalized-fs';

// now go and do stuff with it...
fs.readFileSync('some-file-or-whatever');
```

## Global patching

If you want to patch the global fs module (or any other fs-like module) you can do this:

> NOTE: This should only ever be done at the top-level application layer, in order to delay on `EMFILE` errors from any fs-using dependencies. You should not do this in a library, because it can cause unexpected delays in other parts of the program.

```typescript
import realFs from 'fs';
import nfs from 'normalized-fs';
nfs.normalize(realFs);
```

## Credits

Big thanks to [isaacs](https://github.com/isaacs) who created [graceful-fs](https://github.com/isaacs/node-graceful-fs) which this package is based upon.
