import t from 'tap';

import { app } from '../lib/index.js';

app.log.level = 'debug';

t.test('Home page', async t => {
    const ua = await app.newTestUserAgent({ tap: t });

    await t.test('Authenticated users see the TableTogether home page', async () => {
        await ua.postOk('/login', { formData: { action: 'create', profileName: 'HomeTester' } });

        (await ua.getOk('/'))
            .statusIs(200)
            .bodyLike(/TableTogether/)
            .bodyLike(/Safety Guidelines/)
            .bodyLike(/Signed in as/)
            .bodyLike(/HomeTester/)
            .bodyLike(/Current meetups/)
            .bodyLike(/Create a meetup/);
    });

    await ua.stop();
});
