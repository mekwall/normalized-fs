// Used to determine if we're testing nfs internally
export const NFS_INTERNAL_TEST = !!process.env.NFS_INTERNAL_TEST;
// Used to set the timeout on win32 for certain operations
export const NFS_WIN32_TIMEOUT = process.env.NFS_WIN32_TIMEOUT
  ? parseInt(process.env.NFS_WIN32_TIMEOUT, 10)
  : 5000;
