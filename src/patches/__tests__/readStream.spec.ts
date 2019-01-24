import nfs from '../../';
import path from 'path';

describe('readStream patch', () => {
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

  it('should read files', (done) => {
    let finished = 0;
    expect.assertions(tmpFiles.length);
    for (let file of tmpFiles) {
      const stream = nfs.createReadStream(file);
      let data = '';
      stream.on('data', (c) => {
        data += c;
      });
      stream.on('end', () => {
        expect(data).toBe('content');
        if (++finished === tmpFiles.length) {
          done();
        }
      });
    }
  });
});
