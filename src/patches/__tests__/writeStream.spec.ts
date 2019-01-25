import fs from 'fs';
import { normalize } from '../../';
import path from 'path';

describe('readStream patch', () => {
  const nfs = normalize(fs);
  const tmpFiles: string[] = [];
  const tmpDir = path.resolve(__dirname, '.tmp');

  beforeAll(() => {
    // Make sure to reserve the stderr fd
    process.stderr.write('');
    try {
      nfs.mkdirSync(tmpDir);
    } catch (e) {
      // Ignore
    }
    for (let i = 0; i < 4097; i++) {
      const tmpFile = path.join(tmpDir, 'temp-' + i);
      tmpFiles.push(tmpFile);
    }
  });

  afterAll(() => {
    for (let file of tmpFiles) {
      nfs.unlinkSync(file);
    }
    nfs.rmdirSync(tmpDir);
  });

  it('should write files', (done) => {
    let promises: Promise<void>[] = [];
    expect.assertions(tmpFiles.length * 2);
    for (let file of tmpFiles) {
      promises.push(
        new Promise((resolve) => {
          let gotFinishEvent = false;
          const stream = nfs.createWriteStream(file);
          stream.on('finish', () => {
            gotFinishEvent = true;
          });
          stream.on('close', () => {
            expect(gotFinishEvent).toBe(true);
            resolve();
          });
          stream.write('content');
          stream.end();
        })
      );
    }
    Promise.all(promises).then(() => {
      for (let file of tmpFiles) {
        expect(nfs.readFileSync(file).toString()).toBe('content');
      }
      done();
    });
  });
});
