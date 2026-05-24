import t from 'tap';

import { app } from '../lib/index.js';

app.log.level = 'debug';

t.test('Meetup creation flow', async t => {
    const ua = await app.newTestUserAgent({ tap: t });

    await t.test('Create meetup page is available to authenticated users', async () => {
        await ua.postOk('/login', { formData: { action: 'create', profileName: 'CreatorUser' } });

        (await ua.getOk('/meetups/new'))
            .statusIs(200)
            .bodyLike(/Plan a restaurant meetup/)
            .bodyLike(/Safety confirmation/)
            .bodyLike(/self-declared, optional in spirit, and not verified by the app/i)
            .bodyLike(/List a real public venue that first-time guests can find easily\./);
    });

    await t.test('Submitting a valid meetup creates a record and redirects home', async () => {
        const response = await ua.postOk('/meetups', {
            formData: {
                restaurantName: 'Lantern Kitchen',
                meetupTime: '2026-05-29T19:00',
                photoUrl: 'https://images.example.com/lantern.jpg',
                organizerGender: 'Woman',
                participantGenderPreference: 'No preference',
                totalSeats: '4',
                paymentMode: 'Split bill',
                notes: 'Small dinner near Central Station.',
                safetyAcknowledged: 'on'
            }
        });

        response
            .statusIs(302)
            .headerLike('Location', /\/meetups\/\d+$/);

        (await ua.getOk('/'))
            .statusIs(200)
            .bodyLike(/Lantern Kitchen/)
            .bodyLike(/Split bill/)
            .bodyLike(/View details/);
    });

    await t.test('Invalid photo URL is rejected with a validation error', async t => {
        const response = await ua.postOk('/meetups', {
            formData: {
                restaurantName: 'Bad URL Bistro',
                meetupTime: '2026-05-29T20:00',
                photoUrl: 'http://images.example.com/not-secure.jpg',
                organizerGender: 'Man',
                participantGenderPreference: 'No preference',
                totalSeats: '3',
                paymentMode: 'Split bill',
                notes: 'Testing validation.',
                safetyAcknowledged: 'on'
            }
        });

        response
            .statusIs(400)
            .bodyLike(/Photo URL must be a valid https URL\./);

        t.notMatch(response.body, /Bad URL Bistro<\/h4>/, 'Invalid meetup is not shown in the home card list');
    });

    await t.test('Missing safety confirmation is rejected', async () => {
        (await ua.postOk('/meetups', {
            formData: {
                restaurantName: 'Unsafe Plan',
                meetupTime: '2026-05-29T21:00',
                photoUrl: 'https://images.example.com/safe.jpg',
                organizerGender: 'Non-binary',
                participantGenderPreference: 'No preference',
                totalSeats: '2',
                paymentMode: 'Guest pays',
                notes: 'Checkbox should be required.'
            }
        }))
            .statusIs(400)
            .bodyLike(/You must agree to the safety guidelines before creating a meetup\./);
    });

    await ua.stop();
});
