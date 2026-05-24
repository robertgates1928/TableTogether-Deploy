import t from 'tap';

import { app } from '../lib/index.js';
import { MeetupParticipants } from '../lib/models/meetupParticipants.js';
import { Meetups } from '../lib/models/meetups.js';
import { Users } from '../lib/models/users.js';

app.log.level = 'debug';

function toLocalDateTimeValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

t.test('Home filters', async t => {
    const ua = await app.newTestUserAgent({ tap: t });
    t.after(async () => {
        await ua.stop();
    });

    const users = app.models.users as Users;
    const meetups = app.models.meetups as Meetups;
    const participants = app.models.meetupParticipants as MeetupParticipants;
    const organizer = users.newUser({ profileName: 'FilterOwner' });
    const fullGuest = users.newUser({ profileName: 'FilterGuest' });
    const today = new Date();
    today.setHours(18, 0, 0, 0);
    const future = new Date(today);
    future.setDate(today.getDate() + 10);

    const openMeetup = meetups.newMeetup({
        organizerUserId: organizer.id,
        restaurantName: 'Filter Split Open',
        meetupTime: toLocalDateTimeValue(today),
        photoUrl: 'https://images.example.com/filter-open.jpg',
        organizerGender: 'Woman',
        participantGenderPreference: 'No preference',
        totalSeats: 4,
        paymentMode: 'Split bill',
        notes: 'Open meetup for filter tests.',
        safetyAcknowledged: true
    });

    const fullMeetup = meetups.newMeetup({
        organizerUserId: organizer.id,
        restaurantName: 'Filter Organizer Full',
        meetupTime: toLocalDateTimeValue(today),
        photoUrl: 'https://images.example.com/filter-full.jpg',
        organizerGender: 'Woman',
        participantGenderPreference: 'Woman',
        totalSeats: 2,
        paymentMode: 'Organizer pays',
        notes: 'This meetup should become full.',
        safetyAcknowledged: true
    });

    meetups.newMeetup({
        organizerUserId: organizer.id,
        restaurantName: 'Filter Future Guest',
        meetupTime: toLocalDateTimeValue(future),
        photoUrl: 'https://images.example.com/filter-future.jpg',
        organizerGender: 'Man',
        participantGenderPreference: 'Man',
        totalSeats: 3,
        paymentMode: 'Guest pays',
        notes: 'This meetup is outside the weekly window.',
        safetyAcknowledged: true
    });

    participants.joinMeetup(fullMeetup.id, fullGuest.id);

    await ua.postOk('/login', { formData: { action: 'create', profileName: 'FilterViewer' } });

    await t.test('Filtering by payment, availability, preference, and time window narrows the list', async t => {
        const response = await ua.getOk('/?paymentMode=Organizer%20pays&availability=Full%20only&preference=Woman&timeWindow=This%20week');
        response
            .statusIs(200)
            .bodyLike(/Filter Organizer Full/)
            .bodyLike(/4<\/strong>\s*active filters/)
            .bodyLike(/Open spots:<\/strong>\s*0/);

        t.notMatch(response.body, /Filter Split Open/, 'Open meetup is filtered out');
        t.notMatch(response.body, /Filter Future Guest/, 'Future meetup is filtered out');
    });

    await t.test('Unmatched filters show the filtered empty state', async t => {
        const response = await ua.getOk('/?paymentMode=Guest%20pays&availability=Full%20only&preference=Woman&timeWindow=Today');
        response
            .statusIs(200)
            .bodyLike(/No meetups match these filters\./)
            .bodyLike(/Try widening the time window or clearing one of the active filters\./);

        t.notMatch(response.body, /Filter Split Open/, 'Filtered empty state does not list other meetups');
        t.notMatch(response.body, /Filter Organizer Full/, 'Filtered empty state remains empty');
        t.notMatch(response.body, /Filter Future Guest/, 'Filtered empty state remains empty');
    });

    t.equal(participants.countParticipantsForMeetup(openMeetup.id), 0, 'Open meetup keeps its open spots');
});
