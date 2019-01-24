import fs from '..';

describe('max open files', () => {
  // Get around EBADF from libuv by making sure that stderr is opened
  // Otherwise Darwin will refuse to give us a FD for stderr!
  process.stderr.write('');

  it('should successfully open many files', (done) => {
    expect.assertions(2);
    // How many parallel open()'s to do
    let n = 1024;
    let opens = 0;
    const fds: number[] = [];
    let going = true;
    let closing = false;
    let doneCalled = 0;

    function go() {
      opens++;
      fs.open(__filename, 'r', (err, fd) => {
        if (err) throw err;
        fds.push(fd);
        if (going) go();
      });
    }

    for (let i = 0; i < n; i++) {
      go();
    }

    // should hit ulimit pretty fast
    setTimeout(function() {
      going = false;
      expect(opens - fds.length).toBe(n);
      cleanup();
    }, 100);

    function cleanup() {
      if (closing) return;
      doneCalled++;

      if (fds.length === 0) {
        // First because of the timeout
        // Then to close the fd's opened afterwards
        // Then this time, to complete.
        // Might take multiple passes, depending on CPU speed
        // and ulimit, but at least 3 in every case.
        expect(doneCalled).toBeGreaterThanOrEqual(2);
        done();
        return;
      }

      closing = true;
      setTimeout(function() {
        // console.error('do closing again')
        closing = false;
        cleanup();
      }, 100);

      // console.error('closing time')
      const closes = fds.slice(0);
      fds.length = 0;
      closes.forEach((fd) => {
        fs.close(fd, (err) => {
          if (err) throw err;
        });
      });
    }
  });
});
