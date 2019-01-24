const realFs: any = require('fs');
process.env.NFS_FAKE_NOROOT = '1';

function makeErr(path: string, method: string) {
  const err: NodeJS.ErrnoException = new Error('this is fine');
  err.syscall = method.replace(/Sync$/, '');
  err.code = path.toUpperCase();
  return err;
}

function causeErr(method: string) {
  realFs[method] = function(path: string) {
    const err = makeErr(path, method);
    if (!/Sync$/.test(method)) {
      const cb = arguments[arguments.length - 1];
      process.nextTick(cb.bind(null, err));
    } else {
      throw err;
    }
  };
}

const methods = ['chown', 'chownSync', 'chmod', 'chmodSync'];
methods.forEach((method) => {
  causeErr(method);
});

import nfs from '../../';

describe('chown error ok', () => {
  it('should not result in error for ENOSYS', (done) => {
    nfs.chown('ENOSYS', 1000, 1000, (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should not result in error for EINVAL', (done) => {
    nfs.chown('EINVAL', 1000, 1000, (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should not result in error for EPERM', (done) => {
    nfs.chown('EINVAL', 1000, 1000, (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });
});

describe('chownSync error ok', () => {
  it('should not throw for ENOSYS', () => {
    expect(jest.fn(() => nfs.chownSync('ENOSYS', 0, 0))).not.toThrow();
  });

  it('should not throw for EINVAL', () => {
    expect(jest.fn(() => nfs.chownSync('EINVAL', 0, 0))).not.toThrow();
  });

  it('should not throw for EPERM', () => {
    expect(jest.fn(() => nfs.chownSync('EPERM', 0, 0))).not.toThrow();
  });
});

describe('chmod error ok', () => {
  it('should not result in error for ENOSYS', (done) => {
    nfs.chmod('ENOSYS', 'some mode', (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should not result in error for EINVAL', (done) => {
    nfs.chmod('EINVAL', 'some mode', (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should not result in error for EPERM', (done) => {
    nfs.chmod('EPERM', 'some mode', (err) => {
      expect(err).toBeFalsy();
      done();
    });
  });
});

describe('chmodSync error ok', () => {
  it('should not throw for ENOSYS', () => {
    expect(jest.fn(() => nfs.chmodSync('ENOSYS', 'some mode'))).not.toThrow();
  });

  it('should not throw for EINVAL', () => {
    expect(jest.fn(() => nfs.chmodSync('EINVAL', 'some mode'))).not.toThrow();
  });

  it('should not throw for EPERM', () => {
    expect(jest.fn(() => nfs.chmodSync('EPERM', 'some mode'))).not.toThrow();
  });
});
