import fs from 'fs';
import path from 'path';
import { normalize } from '../../';

describe('readFile patch', () => {
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
      nfs.writeFileSync(tmpFile, 'content');
      tmpFiles.push(tmpFile);
    }
  });

  afterAll(() => {
    for (let file of tmpFiles) {
      nfs.unlinkSync(file);
    }
    nfs.rmdirSync(tmpDir);
  });

  it('should read files', () => {
    for (let file of tmpFiles) {
      nfs.readFile(file, 'ascii', (err, data) => {
        expect(err).toBeFalsy();
        expect(data).toBe('content');
      });
    }
  });
});
