import fs from 'fs';
import { normalize } from '../../';
import path from 'path';

// This might take longer than 5 seconds
jest.setTimeout(30000);

const tmpDir = path.join(__dirname, '.tmp');
const testFiles: string[] = [];

function anyFileExists(files: string[]) {
  for (let i = 0, len = files.length; i < len; i++) {
    if (fs.existsSync(files[i])) return true;
  }
  return false;
}

describe('rename patch: files', () => {
  const nfs = normalize(fs);

  beforeEach(() => {
    let id = 0;
    try {
      fs.mkdirSync(tmpDir);
    } catch (e) {}
    for (let i = 0; i < 500; i++) {
      const testFile = path.join(tmpDir, 'test-' + id++);
      fs.writeFileSync(testFile, id);
      testFiles.push(testFile);
    }
  });

  afterEach(() => {
    while (testFiles.length > 0) {
      const file = testFiles.shift();
      if (file) {
        try {
          fs.unlinkSync(file);
        } catch (e) {}
      }
    }
    try {
      fs.unlinkSync(path.join(tmpDir, 'test'));
    } catch (e) {}
    try {
      fs.rmdirSync(tmpDir);
    } catch (e) {}
  });

  it('should rename asynchronously', (done) => {
    expect.assertions(testFiles.length * 2);
    const dest = path.join(tmpDir, 'test');
    let movedFiles = 0;
    testFiles.forEach((src) => {
      nfs.rename(src, dest, (err) => {
        expect(err).toBeFalsy();
        expect(fs.existsSync(src)).toBe(false);
        if (++movedFiles === testFiles.length) {
          process.nextTick(done);
        }
      });
    });
  });

  it('should rename synchronously', () => {
    expect.assertions(testFiles.length + 1);
    const dest = path.join(tmpDir, 'test');
    for (let i in testFiles) {
      const srcData = fs.readFileSync(testFiles[i]).toString();
      nfs.renameSync(testFiles[i], dest);
      const destData = fs.readFileSync(dest).toString();
      expect(srcData).toEqual(destData);
    }
    expect(anyFileExists(testFiles)).toBe(false);
  });
});

describe('rename patch: directories', () => {
  const nfs = normalize(fs);
  const testDir1 = path.join(tmpDir, 'testDir1');
  const testDir2 = path.join(tmpDir, 'testDir2');

  beforeEach(() => {
    try {
      fs.mkdirSync(tmpDir);
    } catch (e) {}
    try {
      fs.mkdirSync(testDir1);
    } catch (e) {}
    try {
      fs.mkdirSync(testDir2);
    } catch (e) {}
  });

  afterEach(() => {
    try {
      fs.rmdirSync(testDir1);
    } catch (e) {}
    try {
      fs.rmdirSync(testDir2);
    } catch (e) {}
    try {
      fs.rmdirSync(tmpDir);
    } catch (e) {}
  });

  it('should async rename dir to existing', (done) => {
    expect(fs.existsSync(testDir1)).toBe(true);
    nfs.rename(testDir1, testDir2, (err) => {
      expect(err).toBeFalsy();
      expect(fs.existsSync(testDir1)).toBe(false);
      expect(fs.existsSync(testDir2)).toBe(true);
      done();
    });
  });

  it('should sync rename dir to existing', () => {
    expect(fs.existsSync(testDir1)).toBe(true);
    nfs.renameSync(testDir1, testDir2);
    expect(fs.existsSync(testDir1)).toBe(false);
    expect(fs.existsSync(testDir2)).toBe(true);
  });

  it('should return ENOTEMPTY when async rename dir to existing', (done) => {
    expect(fs.existsSync(testDir1)).toBe(true);
    nfs.rename(testDir1, tmpDir, (err) => {
      expect(err).toBeTruthy();
      expect(err.code).toBe('ENOTEMPTY');
      expect(fs.existsSync(testDir1)).toBe(true);
      done();
    });
  });

  it('should throw ENOTEMPTY when sync rename dir to existing', () => {
    expect(jest.fn(() => nfs.renameSync(testDir1, tmpDir))).toThrowError(
      /ENOTEMPTY/
    );
    expect(fs.existsSync(testDir1)).toBe(true);
  });
});
