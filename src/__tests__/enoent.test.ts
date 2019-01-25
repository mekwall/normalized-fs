import fs from 'fs';
import { normalize } from '../';

var methods: any[][] = [
  ['open', 'r'],
  ['readFile'],
  ['stat'],
  ['lstat'],
  ['utimes', new Date(), new Date()],
  ['readdir'],
];

var file = 'this file does not exist even a little bit';

// this test makes sure that various things get enoent, instead of
// some other kind of throw.
describe('ensure ENOENT', () => {
  // any version > v6 can do readdir(path, options, cb)
  if (process.version.match(/^v([6-9]|[1-9][0-9])\./)) {
    methods.push(['readdir', {}]);
  }

  methods.forEach((args) => {
    it(`should throw ENOENT for ${args[0]}`, (done) => {
      expect.assertions(3);
      const nfs: any = normalize(fs);
      const method = args.shift();
      args.unshift(file);
      const methodSync = method + 'Sync';
      expect(jest.fn(() => nfs[methodSync].apply(fs, args))).toThrowError(
        /ENOENT/
      );
      // add the callback
      args.push((e: NodeJS.ErrnoException) => {
        expect(e).toBeTruthy();
        expect(e.code).toBe('ENOENT');
        done();
      });
      nfs[method].apply(fs, args);
    });
  });
});
