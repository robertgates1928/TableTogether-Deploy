import Database from 'better-sqlite3';
import t from 'tap';

import { MeetupParticipants } from '../lib/models/meetupParticipants.js';
import { Meetups } from '../lib/models/meetups.js';
import { Users } from '../lib/models/users.js';

t.test('Meetup Participants Model (SQLite)', async t => {
    const db = new Database(':memory:');
    const users = new Users(db);
    const meetups = new Meetups(db);
    const participants = new MeetupParticipants(db);
    const owner = users.newUser({ profileName: 'Owner' });
    const guest = users.newUser({ profileName: 'Guest' });
    const meetup = meetups.newMeetup({
        organizerUserId: owner.id,
        restaurantName: 'Participant Test',
        meetupTime: '2026-06-05T18:00',
        photoUrl: 'https://images.example.com/participant.jpg',
        organizerGender: 'Woman',
        participantGenderPreference: 'No preference',
        totalSeats: 4,
        paymentMode: 'Split bill',
        notes: 'Model test meetup.',
        safetyAcknowledged: true
    });

    await t.test('participants list starts empty', async t => {
        t.same(participants.listParticipantsForMeetup(meetup.id), [], 'No participants exist yet');
        t.equal(participants.countParticipantsForMeetup(meetup.id), 0, 'Participant count starts at zero');
    });

    await t.test('joinMeetup inserts a participant', async t => {
        t.equal(participants.joinMeetup(meetup.id, guest.id), true, 'Join succeeds');
        t.equal(participants.countParticipantsForMeetup(meetup.id), 1, 'Count updates after join');
        t.equal(participants.listParticipantsForMeetup(meetup.id)[0].profileName, 'Guest', 'Joined user is listed');
    });

    await t.test('duplicate joins are ignored', async t => {
        t.equal(participants.joinMeetup(meetup.id, guest.id), false, 'Duplicate join is ignored');
        t.equal(participants.countParticipantsForMeetup(meetup.id), 1, 'Count does not increase');
        t.equal(participants.isParticipant(meetup.id, guest.id), true, 'Participant check returns true');
    });

    await t.test('leaveMeetup removes the participant', async t => {
        t.equal(participants.leaveMeetup(meetup.id, guest.id), true, 'Leave succeeds');
        t.equal(participants.countParticipantsForMeetup(meetup.id), 0, 'Count decreases after leave');
        t.equal(participants.isParticipant(meetup.id, guest.id), false, 'Participant check returns false');
    });

    db.close();
});
