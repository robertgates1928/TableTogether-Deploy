import fs from 'node:fs';

import Database from "better-sqlite3";
import { MeetupParticipants } from "./models/meetupParticipants.js";
import { Meetups } from "./models/meetups.js";
import { Users } from "./models/users.js";

const CONFIG_PATH = 'config.yml';

function resolveDatabasePath(): string {
    if (!fs.existsSync(CONFIG_PATH)) {
        return 'hub.db';
    }

    const config = fs.readFileSync(CONFIG_PATH, 'utf8');
    const match = config.match(/database:\s*"?([^"\r\n]+)"?/);
    return match?.[1] ?? 'hub.db';
}

function findOrCreateUser(users: Users, profileName: string) {
    return users.listUsers().find(user => user.profileName === profileName)
        ?? users.newUser({ profileName });
}

function findMeetupByName(meetups: Meetups, restaurantName: string) {
    return meetups.listMeetups().find(meetup => meetup.restaurantName === restaurantName);
}

const args = new Set(process.argv.slice(2));
const shouldReset = args.has('--reset');
const dbPath = resolveDatabasePath();

if (shouldReset && fs.existsSync(dbPath)) {
    fs.rmSync(dbPath);
    console.info(`Reset existing database at ${dbPath}.`);
}

const db = new Database(dbPath);
const users = new Users(db);
const meetups = new Meetups(db);
const participants = new MeetupParticipants(db);

const alex = findOrCreateUser(users, 'Alex');
const sam = findOrCreateUser(users, 'Sam');
const jordan = findOrCreateUser(users, 'Jordan');
const taylor = findOrCreateUser(users, 'Taylor');

const lunchMeetup = findMeetupByName(meetups, 'Harbour Noodles') ?? meetups.newMeetup({
    organizerUserId: alex.id,
    restaurantName: 'Harbour Noodles',
    meetupTime: '2026-06-10T12:30',
    photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
    organizerGender: 'Woman',
    participantGenderPreference: 'No preference',
    totalSeats: 4,
    paymentMode: 'Split bill',
    notes: 'Casual lunch near campus. Please arrive on time so we can order together.',
    safetyAcknowledged: true
});

const dinnerMeetup = findMeetupByName(meetups, 'Laneway Grill') ?? meetups.newMeetup({
    organizerUserId: sam.id,
    restaurantName: 'Laneway Grill',
    meetupTime: '2026-06-11T18:45',
    photoUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
    organizerGender: 'Man',
    participantGenderPreference: 'Woman',
    totalSeats: 3,
    paymentMode: 'Organizer pays',
    notes: 'Small dinner in a public venue. Happy to cover the table if everyone confirms early.',
    safetyAcknowledged: true
});

const brunchMeetup = findMeetupByName(meetups, 'Sunny Corner Cafe') ?? meetups.newMeetup({
    organizerUserId: jordan.id,
    restaurantName: 'Sunny Corner Cafe',
    meetupTime: '2026-06-15T10:00',
    photoUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
    organizerGender: 'Non-binary',
    participantGenderPreference: 'No preference',
    totalSeats: 5,
    paymentMode: 'Guest pays',
    notes: 'Public brunch meetup with plenty of daylight and easy transport access.',
    safetyAcknowledged: true
});

participants.joinMeetup(lunchMeetup.id, taylor.id);
participants.joinMeetup(dinnerMeetup.id, jordan.id);
participants.joinMeetup(brunchMeetup.id, alex.id);
participants.joinMeetup(brunchMeetup.id, sam.id);

console.info(`Seed complete for ${dbPath}.`);
console.info(`Users: ${users.listUsers().length}`);
console.info(`Meetups: ${meetups.listMeetups().length}`);
db.close();
