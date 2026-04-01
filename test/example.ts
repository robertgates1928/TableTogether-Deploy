import {app} from '../lib/index.js';
import t from 'tap';

app.log.level = 'debug';

t.test('Example application', async t => {
  const ua = await app.newTestUserAgent({tap: t});

  await t.test('Unauthenticated request redirects to login', async () => {
    (await ua.getOk('/')).statusIs(302).headerLike('Location', /\/login/);
  });

  await t.test('Login page is accessible', async () => {
    (await ua.getOk('/login')).statusIs(200).bodyLike(/Choose a Test User/);
  });

  await ua.stop();
});
