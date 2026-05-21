import Database from 'better-sqlite3';
import t from 'tap';

import { Meetups } from '../lib/models/meetups.js';
import { Users } from '../lib/models/users.js';

t.test('Meetup Model (SQLite)', async t => {
    const db = new Database(':memory:');
    const users = new Users(db);
    const meetups = new Meetups(db);
    const organizer = users.newUser({ profileName: 'Avery' });

    await t.test('listMeetups returns an empty array for a fresh database', async t => {
        t.same(meetups.listMeetups(), [], 'No meetups exist yet');
    });

    await t.test('newMeetup creates a record with the expected fields', async t => {
        const meetup = meetups.newMeetup({
            organizerUserId: organizer.id,
            restaurantName: 'Lantern Kitchen',
            meetupTime: '2026-05-21T19:00',
            photoUrl: 'https://images.example.com/avery.jpg',
            organizerGender: 'Woman',
            participantGenderPreference: 'No preference',
            totalSeats: 4,
            paymentMode: 'Split bill',
            notes: 'Casual dinner before the evening rush.',
            safetyAcknowledged: true
        });

        t.ok(meetup.id, 'Created meetup has an id');
        t.equal(meetup.restaurantName, 'Lantern Kitchen', 'Restaurant name is saved');
        t.equal(meetup.totalSeats, 4, 'Seat count is saved');
        t.equal(meetup.safetyAcknowledged, true, 'Safety confirmation is saved');
    });

    await t.test('meetupWithId returns the stored meetup', async t => {
        const all = meetups.listMeetups();
        const meetup = meetups.meetupWithId(all[0].id);

        t.ok(meetup, 'Meetup can be loaded by id');
        t.equal(meetup?.paymentMode, 'Split bill', 'Payment mode matches');
    });

    await t.test('listMeetups returns newest records first', async t => {
        meetups.newMeetup({
            organizerUserId: organizer.id,
            restaurantName: 'Spice Dock',
            meetupTime: '2026-05-22T18:30',
            photoUrl: 'https://images.example.com/avery-2.jpg',
            organizerGender: 'Woman',
            participantGenderPreference: 'Women',
            totalSeats: 3,
            paymentMode: 'Organizer pays',
            notes: 'Trying the tasting menu.',
            safetyAcknowledged: true
        });

        const all = meetups.listMeetups();
        t.equal(all.length, 2, 'Two meetups exist');
        t.equal(all[0].restaurantName, 'Spice Dock', 'Newest meetup appears first');
    });

    db.close();
});
