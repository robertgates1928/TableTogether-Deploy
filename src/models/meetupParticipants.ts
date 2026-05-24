import Database from "better-sqlite3";

export interface MeetupParticipantRecord {
    id: number | bigint;
    meetupId: number | bigint;
    userId: number | bigint;
    profileName: string;
    joinedAt: string;
}

export class MeetupParticipants {
    db: Database.Database;

    constructor(db: Database.Database) {
        this.db = db;

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS meetup_participants (
                meetup_participant_id INTEGER PRIMARY KEY AUTOINCREMENT,
                meetup_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (meetup_id) REFERENCES meetups(meetup_id),
                FOREIGN KEY (user_id) REFERENCES users(user_id),
                UNIQUE (meetup_id, user_id)
            );
        `);
    }

    listParticipantsForMeetup(meetupId: number | bigint): MeetupParticipantRecord[] {
        return this.db.prepare(`
            SELECT
                mp.meetup_participant_id as id,
                mp.meetup_id as meetupId,
                mp.user_id as userId,
                u.profile_name as profileName,
                mp.joined_at as joinedAt
            FROM meetup_participants mp
            INNER JOIN users u ON u.user_id = mp.user_id
            WHERE mp.meetup_id = ?
            ORDER BY mp.joined_at ASC, mp.meetup_participant_id ASC
        `).all(meetupId) as MeetupParticipantRecord[];
    }

    countParticipantsForMeetup(meetupId: number | bigint): number {
        const result = this.db.prepare(`
            SELECT COUNT(*) as count
            FROM meetup_participants
            WHERE meetup_id = ?
        `).get(meetupId) as { count: number };

        return result.count;
    }

    isParticipant(meetupId: number | bigint, userId: number | bigint): boolean {
        const result = this.db.prepare(`
            SELECT 1
            FROM meetup_participants
            WHERE meetup_id = ? AND user_id = ?
        `).get(meetupId, userId);

        return result != null;
    }

    joinMeetup(meetupId: number | bigint, userId: number | bigint): boolean {
        const result = this.db.prepare(`
            INSERT OR IGNORE INTO meetup_participants (meetup_id, user_id)
            VALUES (?, ?)
        `).run(meetupId, userId);

        return result.changes > 0;
    }

    leaveMeetup(meetupId: number | bigint, userId: number | bigint): boolean {
        const result = this.db.prepare(`
            DELETE FROM meetup_participants
            WHERE meetup_id = ? AND user_id = ?
        `).run(meetupId, userId);

        return result.changes > 0;
    }
}
