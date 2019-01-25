import path from 'path';
const importFresh: any = require('import-fresh');

jest.setTimeout(5 * 60 * 1000);

describe('avoid memory leak', () => {
  it('should not leak when loading multiple times', () => {
    importFresh(path.resolve('./lib')); // node 0.10-5 were getting: Cannot find module '../'
    const mbUsedBefore = process.memoryUsage().heapUsed / Math.pow(1024, 2);
    // simulate project with 4000 tests
    let i = 0;
    function importFreshNormalizedFs() {
      importFresh(path.resolve('./lib'));
      if (i < 4000) {
        i++;
        process.nextTick(() => importFreshNormalizedFs());
      } else {
        global.gc();
        const mbUsedAfter = process.memoryUsage().heapUsed / Math.pow(1024, 2);
        // We expect less than a 2 MB difference
        const memoryUsageMB = Math.round(mbUsedAfter - mbUsedBefore);
        expect(memoryUsageMB).toBeLessThan(2);
      }
    }
    importFreshNormalizedFs();
  });
});
