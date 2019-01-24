import fs from '../../';

describe('open patch', () => {
  it('should be able to open existing file', () => {
    const fd = fs.openSync(__filename, 'r');
    fs.closeSync(fd);
    fs.open(__filename, 'r', (err1, fd) => {
      fs.close(fd, (err2) => {
        expect(err1).toBeFalsy();
        expect(err2).toBeFalsy();
      });
    });
  });

  it('should throw when open non-existing file', () => {
    expect(
      jest.fn(() => {
        fs.openSync(__filename + ' does not exist', 'r');
      })
    ).toThrowError(/ENOENT/);

    expect(
      jest.fn(() => {
        fs.openSync(__filename + ' does not exist either', 'r');
      })
    ).toThrowError(/ENOENT/);
  });
});
