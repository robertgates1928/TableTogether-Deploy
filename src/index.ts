import mojo, { MojoApp, yamlConfigPlugin } from '@mojojs/core';

import Database from "better-sqlite3";
import { Users } from './models/users.js';
import { Uploads } from './models/uploads.js';

import fs from 'fs';
import path from 'node:path';

// Fill in empty config if missing
if (!fs.existsSync('config.yml')) createDefaultConfig();

// Mojo App
export const app: MojoApp = mojo();

app.plugin(yamlConfigPlugin);
app.secrets = app.config.secrets;

// DB Connect
const db = new Database(app.config.database)

// Model registration
app.models.users = new Users(db);
app.models.uploads = new Uploads(db);

// Auth hook — redirect unauthenticated users to /login
// Skip the login page and static assets served from public/ (file extension but not a routed path)
app.addContextHook('dispatch:before', async (ctx) => {
    const reqPath = ctx.req.path;
    if (reqPath === '/login') return;
    if (/\.\w+$/.test(reqPath) && !reqPath.startsWith('/uploads/')) return;

    const session = await ctx.session();
    if (!session.userId) {
        await ctx.redirectTo('/login');
        return false;
    }

    // Make session data available to templates via the stash
    ctx.stash.profileName = session.profileName;
});

// Routing
app.get('/login').to('auth#loginPage');
app.post('/login').to('auth#loginAction');
app.get('/logout').to('auth#logout');

app.get('/').to('example#welcome');

// Serve uploaded files from the uploads/ directory
// Use # (relaxed placeholder) so filenames with dots are matched
app.get('/uploads/#filename', async (ctx) => {
    if (ctx.res.isSent) return;

    // Reject any filename containing path traversal characters
    const filename = ctx.stash.filename;
    if (filename !== path.basename(filename) || filename.includes('..')) {
        return ctx.render({ status: 404, text: 'Not found' });
    }

    await ctx.sendFile(ctx.home.child('uploads', filename));
});

// Demo routes — reference examples for students
app.get('/demo/upload').to('demo#uploadPage');
app.post('/demo/upload').to('demo#uploadAction');
app.delete('/demo/upload/:id').to('demo#deleteUpload');

app.start();

// function for generating a valid configuration file if one is missing
function createDefaultConfig() {
    const passwordGen = () => {
        // This is a stand in for a password generator. This is generating the key used to encrypt the sessions handed out to users.
        const passwordOptions = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$^&*()/?".split('')
        let secret = '';
        for (let i = 0; i < 16; i++) {
            secret += passwordOptions[Math.floor(Math.random() * passwordOptions.length)];
        }
        return secret
    }

    // Just using text formatting to layout the simple yaml file
    // This is ok for atomic values, but is problematic if you try to include a datastructure
    // Any keys added here can be accesses by app.config.secrets
    fs.writeFileSync('config.yml', `---
secrets:
  - ${passwordGen()}
database: "hub.db"`)
}