import fs from 'fs';
import path from 'path';
import { normalize } from '../../';
import { NFS_WIN32_TIMEOUT } from '../../constants';

// This can take a long time on Windows due to locked files
jest.setTimeout(NFS_WIN32_TIMEOUT * 10);

describe('unlink patch', () => {
  const nfs = normalize(fs);
  const tmpFiles: string[] = [];
  const tmpDir = path.resolve(__dirname, '.tmp');

  // Make sure to reserve the stderr fd
  process.stderr.write('');

  beforeEach(() => {
    try {
      nfs.mkdirSync(tmpDir);
    } catch (e) {
      // Ignore
    }
    for (let i = 0; i < 4097; i++) {
      const tmpFile = path.join(tmpDir, 'temp-' + i);
      nfs.writeFileSync(tmpFile, 'content');
      tmpFiles.push(tmpFile);
    }
  });

  afterAll(() => {
    // They should already be gone but let's make sure
    for (let file of tmpFiles) {
      nfs.unlinkSync(file);
    }
    nfs.rmdirSync(tmpDir);
  });

  it('should synchronously unlink files', () => {
    expect.assertions(tmpFiles.length);
    while (tmpFiles.length > 0) {
      const file = tmpFiles.shift();
      if (file) {
        expect(jest.fn(() => nfs.unlinkSync(file))).not.toThrow();
      }
    }
  });

  it('should asynchronously unlink files', (done) => {
    expect.assertions(tmpFiles.length);
    const promises: Promise<void>[] = [];
    while (tmpFiles.length > 0) {
      const file = tmpFiles.shift();
      if (file) {
        promises.push(
          new Promise((resolve, reject) => {
            nfs.unlink(file, (err) => {
              expect(err).toBeFalsy();
              if (err) {
                return reject();
              }
              resolve();
            });
          })
        );
      }
    }
    Promise.all(promises)
      .then(() => done())
      .catch((err) => done.fail(err));
  });
});
