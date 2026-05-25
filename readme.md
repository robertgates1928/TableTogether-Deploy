# TableTogether

TableTogether is a community hub prototype for BlaBla Corp. 
It helps logged-in users create small restaurant meetups, browse current plans, and join or leave tables with clear expectations about venue, timing, payment, and safety.

The project uses the required stack from the assignment brief:

- `MojoJS` for routes, controllers, and server-rendered templates
- `SQLite` via `better-sqlite3` for persistent storage
- `htmx` loaded through the shared layout for progressive enhancement

## Core Features

- Session-based login with reusable test profiles
- Create meetup flow with server-side validation
- Meetup detail page with join / leave behaviour
- Capacity tracking with duplicate-join protection
- Home feed filters for payment mode, availability, preference, and time window
- Responsible implementation copy around public venues, consent, self-declared identity, and essential cookies

## Tech Notes

- Recommended runtime: `Node.js 20`
- If your machine uses `nvm`, switch before installing:

```sh
nvm use 20
```

- The app stores data in the SQLite database configured by `config.yml`
- If `config.yml` is missing, the app creates one automatically and defaults to `hub.db`

## Getting Started

```sh
npm install
npm run seed
npm run dev
```

Then open the local server in your browser. Unauthenticated users are redirected to `/login`.

## Seed Data

Two seed commands are available:

```sh
npm run seed
npm run seed:reset
```

- `npm run seed` keeps the current database and adds missing demo data if needed
- `npm run seed:reset` deletes the current database file and rebuilds it with fresh sample users, meetups, and participant records

The seed script creates demo profiles and several realistic public-venue meetups so the filters, detail page, and join flow are easy to test.

## Project Structure

```text
src/
  index.ts                    App setup, auth hook, model registration, routes
  seed.ts                     Demo database seeding
  controllers/
    auth.ts                   Login and logout flow
    home.ts                   Home feed and filters
    meetups.ts                Create, detail, join, and leave actions
    demo.ts                   Reference file-upload example
  models/
    users.ts                  User profiles
    meetups.ts                Meetup records
    meetupParticipants.ts     Join / leave records
    uploads.ts                Demo upload records
views/
  layouts/default.html.tmpl   Shared layout
  auth/                       Login page
  home/                       Home feed
  meetups/                    Create and detail pages
public/
  styles.css                  App styling
dbml/schema.dbml              Database schema documentation
test/                         Model and route tests
```

## Responsible Implementation

This project deliberately limits what user data is collected:

- No signup email, phone number, or private address is required
- Profile images use pasted `https` URLs instead of file uploads
- Gender and preference fields are treated as self-declared planning information
- Safety messaging appears on the home page, create page, and detail page
- The app explicitly reminds users to meet only in public venues
- Session cookies are described as essential authentication cookies

## Testing

Run the full verification suite with:

```sh
npm run build:test
npm run lint
```

The suite includes:

- Authentication flow tests
- Home feed and filter tests
- Meetup creation, detail, and participation tests
- Database model tests for users, meetups, participants, and uploads

## Demo Flow

For a quick demonstration:

1. Run `npm run seed:reset`
2. Run `npm run dev`
3. Log in with an existing seeded profile
4. Browse the home feed and apply filters
5. Open a meetup detail page and test join / leave behaviour
6. Create a new meetup and review the safety confirmation flow

## Database Schema

The schema reference lives in `dbml/schema.dbml`. It documents:

- `users`
- `meetups`
- `meetup_participants`
- `uploads`
