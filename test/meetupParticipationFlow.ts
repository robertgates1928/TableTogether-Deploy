import t from 'tap';

import { app } from '../lib/index.js';
import { Meetups } from '../lib/models/meetups.js';

app.log.level = 'debug';

t.test('Meetup participation flow', async t => {
    const ownerUa = await app.newTestUserAgent({ tap: t });
    const guestUa = await app.newTestUserAgent({ tap: t });
    const extraUa = await app.newTestUserAgent({ tap: t });

    t.after(async () => {
        await ownerUa.stop();
        await guestUa.stop();
        await extraUa.stop();
    });

    await ownerUa.postOk('/login', { formData: { action: 'create', profileName: 'OwnerUser' } });
    await ownerUa.postOk('/meetups', {
        formData: {
            restaurantName: 'Join Test Grill',
            meetupTime: '2026-06-07T18:00',
            photoUrl: 'https://images.example.com/join.jpg',
            organizerGender: 'Woman',
            participantGenderPreference: 'No preference',
            totalSeats: '2',
            paymentMode: 'Split bill',
            notes: 'One guest spot only.',
            safetyAcknowledged: 'on'
        }
    });

    const meetupsModel = app.models.meetups as Meetups;
    const meetupId = meetupsModel.listMeetups()[0].id;
    const detailPath = `/meetups/${meetupId}`;

    await guestUa.postOk('/login', { formData: { action: 'create', profileName: 'GuestUser' } });
    await extraUa.postOk('/login', { formData: { action: 'create', profileName: 'ExtraUser' } });

    await t.test('Guest can join an open meetup', async () => {
        (await guestUa.getOk(detailPath))
            .statusIs(200)
            .bodyLike(/Open spots/)
            .bodyLike(/Join meetup/);

        (await guestUa.postOk(`${detailPath}/join`))
            .statusIs(302)
            .headerLike('Location', new RegExp(`${detailPath.replace('/', '\\/')}?$`));

        (await guestUa.getOk(detailPath))
            .statusIs(200)
            .bodyLike(/Leave meetup/)
            .bodyLike(/GuestUser/)
            .bodyLike(/This meetup is currently full|Open spots/);
    });

    await t.test('Duplicate joins are rejected for the same guest', async () => {
        (await guestUa.postOk(`${detailPath}/join`))
            .statusIs(400)
            .bodyLike(/You have already joined this meetup\./);
    });

    await t.test('Full meetups reject additional guests', async () => {
        (await extraUa.postOk(`${detailPath}/join`))
            .statusIs(400)
            .bodyLike(/This meetup is already full\./);
    });

    await t.test('Leaving frees the spot again', async t => {
        (await guestUa.postOk(`${detailPath}/leave`))
            .statusIs(302)
            .headerLike('Location', new RegExp(`${detailPath.replace('/', '\\/')}?$`));

        const response = await guestUa.getOk(detailPath);
        response
            .statusIs(200)
            .bodyLike(/Join meetup/);
        t.notMatch(response.body, /GuestUser<\/li>/, 'Leaving removes the guest from the participant list');
    });

    await t.test('Organizer cannot use the leave action', async () => {
        (await ownerUa.postOk(`${detailPath}/leave`))
            .statusIs(400)
            .bodyLike(/Organizers cannot leave their own meetup from this screen\./);
    });
});
