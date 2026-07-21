export {
  getLocalUserRepository,
  localUserDataStorageKey,
  LocalUserRepository,
  LOCAL_USER_DATA_KEY_PREFIX,
  LOCAL_USER_DATA_VERSION,
  type LocalCollectionName,
  type LocalEntity,
  type LocalStorageAdapter,
  type LocalUserDataDocument,
} from './local-user.repository';
export { resolveUserDataBackend, type UserDataBackend } from './resolver';
