import {app} from '../lib/index.js';
import t from 'tap';

// This test demonstrates how to test a multi-step user flow across pages.
// It walks through the full authentication lifecycle:
//   unauthenticated → login → protected page → logout → redirected again

app.log.level = 'debug';

t.test('Auth flow', async t => {
  const ua = await app.newTestUserAgent({tap: t});

  // Step 1: Unauthenticated users are redirected to login
  await t.test('Unauthenticated request redirects to /login', async () => {
    (await ua.getOk('/')).statusIs(302).headerLike('Location', /\/login/);
  });

  // Step 2: The login page renders and is publicly accessible
  await t.test('Login page is accessible', async () => {
    (await ua.getOk('/login')).statusIs(200).bodyLike(/Choose a Test User/);
  });

  // Step 3: Create a new user and log in via the form
  await t.test('Creating a user logs in and redirects to /', async () => {
    (await ua.postOk('/login', { formData: { action: 'create', profileName: 'FlowTester' } }))
      .statusIs(302).headerLike('Location', /\//);
  });

  // Step 4: Authenticated users can access the welcome page
  await t.test('Welcome page shows the logged-in user name', async () => {
    (await ua.getOk('/')).statusIs(200).bodyLike(/FlowTester/);
  });

  // Step 5: Logout clears the session and redirects to /login
  await t.test('Logout redirects to /login', async () => {
    (await ua.getOk('/logout')).statusIs(302).headerLike('Location', /\/login/);
  });

  // Step 6: After logout, protected pages redirect again
  await t.test('Protected page redirects after logout', async () => {
    (await ua.getOk('/')).statusIs(302).headerLike('Location', /\/login/);
  });

  await ua.stop();
});
