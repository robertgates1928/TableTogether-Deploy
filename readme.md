# Bla Bla Corp Community Hub Prototype

This repository provides a starting foundation for a community hub prototype project. You can fork this project to start your own project. This means you may also be able to pull any updates to the prototype and merge them with your work if needed.

This prototype uses SQLite (via `better-sqlite3`) for data storage. A simple session-based login system lets testers pick an existing user or create a new one.

## Getting Started

Seed the database with a default test user:

```sh
npm run seed
```

Start the development server:

```sh
npm run build:dev
```

Visit the app in your browser. You will be redirected to the **login page** where you can select an existing user or create a new one. Use the `/logout` route to switch users.

## Commands

### Linting

```sh
npm run lint:all
```

Apply automated fixes with:

```sh
npm run lint:all:fix
```

#### TypeScript

```sh
npm run lint:ts
```

Apply automated fixes with:

```sh
npm run lint:ts:fix
```

#### CSS

```sh
npm run lint:css
```

Apply automated fixes with:

```sh
npm run lint:css:fix
```

## Git LFS

Git LFS is used to track binary files.

### Is git LFS working?

Check `test_data/lfs-image-test.png` if you see an image of some cats, it's working! Remember that GitHub Desktop is separate to any git instance you can see on the command line, so if you aren't confident setting up the command line git, use github desktop for checking in commits and pulling from the remote.
