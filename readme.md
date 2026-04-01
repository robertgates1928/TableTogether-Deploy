# Bla Bla Corp Community Hub Prototype

This repository provides a starting foundation for a community hub prototype project. Fork this repository to start your own project — you can pull updates from the upstream and merge them with your work if needed.

The prototype uses **SQLite** (via `better-sqlite3`) for data storage and **mojo.js** as the web framework. A simple session-based login system lets testers pick an existing user or create a new one.

## Getting Started

```sh
npm install        # Install dependencies
npm run seed       # Create the database and a default test user
npm run dev        # Start the development server
```

`npm run dev` watches `src/` and `views/` for changes, rebuilds TypeScript automatically, and restarts the server.

Open the app in your browser — you will be redirected to the **login page** where you can select an existing test user or create a new one. Visit `/logout` to switch users.

## Project Structure

```
src/                    TypeScript source (compiled to lib/)
  index.ts              App entry point — config, models, auth hook, routes
  seed.ts               Standalone script to seed the database
  fileStore.ts          Helpers for saving uploaded files to disk
  controllers/          Route handlers (one class per controller)
    auth.ts             Login / logout
    example.ts          Welcome page
    demo.ts             Demo pages (file upload example)
  models/               Database models (one class per table)
    users.ts            Users table
    uploads.ts          Uploads table (linked to users)
views/                  Server-rendered templates (.html.tmpl)
  layouts/default.html.tmpl   Shared page layout
  auth/                 Login page
  example/              Welcome page
  demo/                 Demo pages
public/                 Static files served directly (CSS, images, HTML)
test/                   Tests (run with tap)
dbml/schema.dbml        Database schema documentation
```

## Key Concepts

### Routing

Routes are defined in `src/index.ts`. Each route maps an HTTP method and path to a controller action:

```ts
app.get('/demo/upload').to('demo#uploadPage');
```

This calls the `uploadPage` method on the default export of `src/controllers/demo.ts`.

### Controllers

Controllers live in `src/controllers/`. Each file exports a class whose methods handle requests:

```ts
export default class Controller {
    async welcome(ctx: MojoContext): Promise<void> {
        await ctx.render();
    }
}
```

The `ctx` object gives access to the request, session, models, and rendering. Calling `ctx.render()` without arguments renders the template matching the controller and action name (e.g. `views/example/welcome.html.tmpl`).

### Models

Models live in `src/models/`. Each model class takes a `better-sqlite3` database instance and creates its table in the constructor. Methods use synchronous `prepare`/`run`/`all` calls:

```ts
const user = users.newUser({ profileName: 'Alice' });
const all = users.listUsers();
```

Models are registered on `app.models` in `src/index.ts` and accessed in controllers via `ctx.models`.

### Templates

Templates use mojo.js's embedded JavaScript (`.html.tmpl` files) in the `views/` directory. They support layouts, stash variables, and standard JS control flow:

```html
% view.layout = 'default';
<h2>Welcome, <%= ctx.stash.profileName %>!</h2>
```

The layout wraps every page with the shared header, footer, and stylesheets.

### Sessions

The app uses encrypted cookie sessions (built into mojo.js). After login, the user's ID and profile name are stored in the session. An auth hook in `src/index.ts` redirects unauthenticated users to `/login` — static files in `public/` are unaffected.

The logged-in user's name is available in templates via `ctx.stash.profileName`.

### File Uploads

`src/fileStore.ts` provides two helpers:

- `saveFile(ctx, destinationDir, fieldName)` — save a single uploaded file and return its metadata (or `null`)
- `saveFiles(ctx, destinationDir)` — save all uploaded files from a multipart form

Files are renamed with a UUID to prevent collisions. See the demo upload page for a complete working example:

- **Controller:** `src/controllers/demo.ts` — saves the file to disk and inserts a record into the `uploads` table
- **Form template:** `views/demo/uploadPage.html.tmpl` — a `multipart/form-data` form with a file input
- **Partial template:** `views/demo/_uploadRow.html.tmpl` — HTML fragment returned to htmx requests
- **Route:** `GET /demo/upload` and `POST /demo/upload` (defined in `src/index.ts`)

### htmx

[htmx](https://htmx.org/) is included and loaded on every page. It lets you make AJAX requests, swap page content, and handle events directly from HTML attributes — no client-side JavaScript required.

The demo upload page shows the core pattern:

```html
<form method="post" action="/demo/upload" enctype="multipart/form-data"
      hx-post="/demo/upload"
      hx-target="#upload-list"
      hx-swap="afterbegin"
      hx-encoding="multipart/form-data">
```

- `hx-post` — submit via AJAX instead of a full page reload
- `hx-target` — where to put the response (`#upload-list`)
- `hx-swap` — how to insert it (`afterbegin` prepends to the target)
- `hx-encoding` — required for file uploads

On the server side, the controller checks for the `HX-Request` header. If present, it returns just an HTML fragment (no layout). If not (e.g. JavaScript is disabled), it falls back to a standard redirect. See `src/controllers/demo.ts` for the full pattern.

For more, see the [htmx documentation](https://htmx.org/docs/).

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Build, start server, and watch for changes |
| `npm run build` | Compile TypeScript to `lib/` |
| `npm run test` | Run tests |
| `npm run build:test` | Build then test |
| `npm run seed` | Build then seed the database |
| `npm run lint` | Check TypeScript and CSS |
| `npm run lint:fix` | Auto-fix lint issues |

## Testing

Tests live in `test/` and use [tap](https://node-tap.org/). Run them with:

```sh
npm run build:test
```

- **Model tests** (`test/modelUsers.ts`, `test/modelUploads.ts`) use an in-memory SQLite database (`:memory:`) for isolation — they don't touch the real database file. These are good templates for testing your own models.
- **Auth flow test** (`test/authFlow.ts`) walks through the full login → protected page → logout → redirect cycle using the test user agent. This is a good example of how to test multi-step user flows across pages.
- **File upload test** (`test/filesStore.ts`) tests the `/demo/upload` route end-to-end: authenticates, uploads files, and verifies they are saved to disk.

## Integrating Your Front-End

If you have an existing HTML/CSS/JS project from an earlier design phase, here's how to bring it into this prototype.

### Static assets

CSS, client-side JavaScript, images, and fonts go in `public/`. They are served directly by the framework without any processing. Reference them in templates with:

```html
<link rel="stylesheet" href="<%= ctx.urlForFile('your-styles.css') %>">
<script src="<%= ctx.urlForFile('your-script.js') %>"></script>
```

Or add them to the shared layout in `views/layouts/default.html.tmpl` so they load on every page.

### Converting static pages to templates

Pages that need dynamic content (showing the logged-in user, data from the database, form handling) should become templates rather than static HTML. To convert a static page:

1. Take the content inside `<body>` from your HTML file
2. Create a new `.html.tmpl` file in the appropriate `views/` subdirectory
3. Add `% view.layout = 'default';` at the top to wrap it in the shared layout
4. Use `<%= %>` tags wherever you need dynamic values
5. Add a route and controller action in `src/index.ts` to serve it

Pages that don't need any server-side data can stay as static HTML in `public/`.

### Client-side TypeScript

If your front-end uses TypeScript, you'll need a separate compilation step since the existing `tsconfig.json` targets Node.js (server-side). Create a `tsconfig.client.json` in the project root:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "outDir": "public/js",
    "rootDir": "src/client",
    "strict": true
  },
  "include": ["src/client/**/*"]
}
```

Place your browser-side TypeScript in `src/client/`. Then update the build script in `package.json` to compile both:

```json
"build": "tsc --build ./ && tsc --build tsconfig.client.json"
```

The compiled JavaScript will appear in `public/js/` and can be included in templates with a `<script>` tag.

## Database Schema

The database schema is documented in `dbml/schema.dbml`. Keep this file up to date as you add or modify tables.

## Git LFS

Git LFS is used to track binary files (images, videos, etc. — see `.gitattributes` for the full list).

To check if Git LFS is working, look at `test_data/lfs-image-test.png` — if you see an image of some cats, it's working. If you see a small text file, Git LFS is not configured correctly.

Remember that GitHub Desktop uses its own Git instance. If you aren't confident setting up Git LFS on the command line, use GitHub Desktop for commits and pulls.
