import t from 'tap';

import { app } from '../lib/index.js';
import { Meetups } from '../lib/models/meetups.js';

app.log.level = 'debug';

t.test('Meetup details flow', async t => {
    const ua = await app.newTestUserAgent({ tap: t });
    t.after(async () => {
        await ua.stop();
    });

    await ua.postOk('/login', { formData: { action: 'create', profileName: 'DetailOwner' } });

    await ua.postOk('/meetups', {
        formData: {
            restaurantName: 'Detail Diner',
            meetupTime: '2026-06-01T18:30',
            photoUrl: 'https://images.example.com/detail.jpg',
            organizerGender: 'Woman',
            participantGenderPreference: 'No preference',
            totalSeats: '5',
            paymentMode: 'Organizer pays',
            notes: 'Please arrive on time so we can order together.',
            safetyAcknowledged: 'on'
        }
    });

    const meetupsModel = app.models.meetups as Meetups;
    const detailPath = `/meetups/${meetupsModel.listMeetups()[0].id}`;

    await t.test('Home page cards link to a detail page', async () => {
        (await ua.getOk('/'))
            .statusIs(200)
            .bodyLike(/Detail Diner/)
            .bodyLike(/Organizer pays/)
            .bodyLike(new RegExp(detailPath.replace('/', '\\/')))
            .bodyLike(/Please arrive on time so we can order together\./);
    });

    await t.test('Detail page shows the full meetup information and owner status', async () => {
        (await ua.getOk(detailPath))
            .statusIs(200)
            .bodyLike(/Detail Diner/)
            .bodyLike(/You created this meetup\./)
            .bodyLike(/Organizer pays/)
            .bodyLike(/Please arrive on time so we can order together\./)
            .bodyLike(/Preferred participant gender/)
            .bodyLike(/Back to all meetups/);
    });

    await t.test('Unknown meetup ids return a 404 response', async () => {
        (await ua.getOk('/meetups/999999'))
            .statusIs(404)
            .bodyLike(/Meetup not found\./);
    });
});
