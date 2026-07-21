const fs = require('node:fs');
const path = require('node:path');

const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');
const { deleteObject, getBytes, ref, uploadBytes } = require('firebase/storage');

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'tradevision-rules-test',
    storage: {
      rules: fs.readFileSync(path.resolve(__dirname, '../../firebase/rules/storage.rules'), 'utf8'),
    },
  });
});

afterEach(async () => {
  await testEnv.clearStorage();
});

afterAll(async () => {
  await testEnv.cleanup();
});

function storageFor(uid, emailVerified = true, provider = 'password') {
  return testEnv
    .authenticatedContext(uid, {
      email_verified: emailVerified,
      firebase: { sign_in_provider: provider },
    })
    .storage();
}

test('allows verified owners to store and delete supported images up to 5MB', async () => {
  const storage = storageFor('owner');
  const avatar = ref(storage, 'users/owner/avatar/profile.png');
  const journalImage = ref(storage, 'users/owner/journal/entry-1/chart.webp');

  await assertSucceeds(
    uploadBytes(avatar, new Uint8Array(5 * 1024 * 1024), {
      contentType: 'image/png',
    }),
  );
  await assertSucceeds(
    uploadBytes(journalImage, new Uint8Array([1]), {
      contentType: 'image/webp',
    }),
  );
  await assertSucceeds(getBytes(avatar, 1));
  await assertSucceeds(deleteObject(journalImage));
});

test('rejects oversized files and non-image MIME types', async () => {
  const storage = storageFor('owner');

  await assertFails(
    uploadBytes(ref(storage, 'users/owner/avatar/large.jpg'), new Uint8Array(5 * 1024 * 1024 + 1), {
      contentType: 'image/jpeg',
    }),
  );
  await assertFails(
    uploadBytes(ref(storage, 'users/owner/avatar/not-image.txt'), new Uint8Array([1]), {
      contentType: 'text/plain',
    }),
  );
});

test('rejects anonymous, unverified, and cross-user writes', async () => {
  const anonymous = storageFor('anonymous-user', false, 'anonymous');
  const unverified = storageFor('unverified', false);
  const other = storageFor('other');

  await assertFails(
    uploadBytes(ref(anonymous, 'users/anonymous-user/avatar/profile.png'), new Uint8Array([1]), {
      contentType: 'image/png',
    }),
  );
  await assertFails(
    uploadBytes(ref(unverified, 'users/unverified/avatar/profile.png'), new Uint8Array([1]), {
      contentType: 'image/png',
    }),
  );
  await assertFails(
    uploadBytes(ref(other, 'users/owner/avatar/profile.png'), new Uint8Array([1]), {
      contentType: 'image/png',
    }),
  );
});

test('enforces owner reads and default deny outside approved paths', async () => {
  const owner = storageFor('owner');
  const other = storageFor('other');
  const avatarPath = 'users/owner/avatar/profile.png';

  await assertSucceeds(
    uploadBytes(ref(owner, avatarPath), new Uint8Array([1]), { contentType: 'image/png' }),
  );
  await assertFails(getBytes(ref(other, avatarPath), 1));
  await assertFails(
    uploadBytes(ref(owner, 'public/profile.png'), new Uint8Array([1]), {
      contentType: 'image/png',
    }),
  );
});
