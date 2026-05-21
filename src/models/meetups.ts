import Database from "better-sqlite3";

export interface NewMeetup {
    organizerUserId: number | bigint;
    restaurantName: string;
    meetupTime: string;
    photoUrl: string;
    organizerGender: string;
    participantGenderPreference: string;
    totalSeats: number;
    paymentMode: string;
    notes: string;
    safetyAcknowledged: boolean;
}

export interface MeetupRecord {
    id: number | bigint;
    organizerUserId: number | bigint;
    restaurantName: string;
    meetupTime: string;
    photoUrl: string;
    organizerGender: string;
    participantGenderPreference: string;
    totalSeats: number;
    paymentMode: string;
    notes: string;
    safetyAcknowledged: boolean;
    createdAt: string;
}

export class Meetups {
    db: Database.Database;

    constructor(db: Database.Database) {
        this.db = db;

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS meetups (
                meetup_id INTEGER PRIMARY KEY AUTOINCREMENT,
                organizer_user_id INTEGER NOT NULL,
                restaurant_name TEXT NOT NULL,
                meetup_time TEXT NOT NULL,
                photo_url TEXT NOT NULL,
                organizer_gender TEXT NOT NULL,
                participant_gender_preference TEXT NOT NULL,
                total_seats INTEGER NOT NULL CHECK(total_seats > 0),
                payment_mode TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                safety_acknowledged INTEGER NOT NULL DEFAULT 0 CHECK (safety_acknowledged IN (0, 1)),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organizer_user_id) REFERENCES users(user_id)
            );
        `);
    }

    listMeetups(): MeetupRecord[] {
        const rows = this.db.prepare(`
            SELECT
                meetup_id as id,
                organizer_user_id as organizerUserId,
                restaurant_name as restaurantName,
                meetup_time as meetupTime,
                photo_url as photoUrl,
                organizer_gender as organizerGender,
                participant_gender_preference as participantGenderPreference,
                total_seats as totalSeats,
                payment_mode as paymentMode,
                notes,
                safety_acknowledged as safetyAcknowledged,
                created_at as createdAt
            FROM meetups
            ORDER BY meetup_id DESC
        `).all() as Array<MeetupRecord & { safetyAcknowledged: number | boolean }>;

        return rows.map(row => this.normalizeMeetup(row));
    }

    meetupWithId(id: number | bigint): MeetupRecord | undefined {
        const row = this.db.prepare(`
            SELECT
                meetup_id as id,
                organizer_user_id as organizerUserId,
                restaurant_name as restaurantName,
                meetup_time as meetupTime,
                photo_url as photoUrl,
                organizer_gender as organizerGender,
                participant_gender_preference as participantGenderPreference,
                total_seats as totalSeats,
                payment_mode as paymentMode,
                notes,
                safety_acknowledged as safetyAcknowledged,
                created_at as createdAt
            FROM meetups
            WHERE meetup_id = ?
        `).get(id) as (MeetupRecord & { safetyAcknowledged: number | boolean }) | undefined;

        return row ? this.normalizeMeetup(row) : undefined;
    }

    newMeetup(meetup: NewMeetup): MeetupRecord {
        const lastId = this.db.prepare(`
            INSERT INTO meetups (
                organizer_user_id,
                restaurant_name,
                meetup_time,
                photo_url,
                organizer_gender,
                participant_gender_preference,
                total_seats,
                payment_mode,
                notes,
                safety_acknowledged
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            meetup.organizerUserId,
            meetup.restaurantName,
            meetup.meetupTime,
            meetup.photoUrl,
            meetup.organizerGender,
            meetup.participantGenderPreference,
            meetup.totalSeats,
            meetup.paymentMode,
            meetup.notes,
            meetup.safetyAcknowledged ? 1 : 0
        ).lastInsertRowid;

        const createdMeetup = this.meetupWithId(lastId);
        if (!createdMeetup) {
            throw new Error('Failed to load created meetup.');
        }

        return createdMeetup;
    }

    private normalizeMeetup(row: MeetupRecord & { safetyAcknowledged: number | boolean }): MeetupRecord {
        return {
            ...row,
            safetyAcknowledged: Boolean(row.safetyAcknowledged)
        };
    }
}
