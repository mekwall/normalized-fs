if (process.env.NFS_INTERNAL_TEST) {
  const fs = require('fs');
  module.exports = fs;
  module.exports.gracefulify = () => fs;
} else {
  try {
    const nfs = require('normalized-fs');
    module.exports = nfs;
    module.exports.gracefulify = nfs.normalize;
  } catch (e) {
    const nfs = require('../../');
    module.exports = nfs;
    module.exports.gracefulify = nfs.normalize;
  }
}
