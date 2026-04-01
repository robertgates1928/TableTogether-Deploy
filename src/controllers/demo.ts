import type { MojoContext } from '@mojojs/core';
import { saveFile } from '../fileStore.js';
import { Uploads } from '../models/uploads.js';
import fs from 'node:fs';

const UPLOAD_DIR = 'uploads';

export default class Controller {
    // Render the upload form with a list of previous uploads
    async uploadPage(ctx: MojoContext): Promise<void> {
        const session = await ctx.session();
        const uploadsModel = ctx.models.uploads as Uploads;
        ctx.stash.uploads = uploadsModel.listUploadsForUser(session.userId);
        await ctx.render();
    }

    // Handle file upload: save to disk, record in database
    // If the request came from htmx, return just a fragment (no layout).
    // Otherwise, redirect back to the upload page (standard form behaviour).
    async uploadAction(ctx: MojoContext): Promise<void> {
        const session = await ctx.session();
        const uploadsModel = ctx.models.uploads as Uploads;
        const isHtmx = ctx.req.get('HX-Request') === 'true';

        const saved = await saveFile(ctx, UPLOAD_DIR, 'file');
        if (saved == null) {
            if (isHtmx) {
                await ctx.render({ text: '<p>No file was uploaded.</p>' });
            } else {
                await ctx.redirectTo('/demo/upload');
            }
            return;
        }

        // Store the upload record linked to the logged-in user
        const record = uploadsModel.insertUpload(session.userId, saved);

        if (isHtmx) {
            // Return just the new row as an HTML fragment (no layout)
            ctx.stash.upload = record;
            await ctx.render({ view: 'demo/_uploadRow' });
        } else {
            // Standard form post — redirect back to the page
            await ctx.redirectTo('/demo/upload');
        }
    }

    // Delete an upload: remove from database and disk
    // Returns empty response so htmx can remove the row from the DOM
    async deleteUpload(ctx: MojoContext): Promise<void> {
        const session = await ctx.session();
        const uploadsModel = ctx.models.uploads as Uploads;
        const uploadId = Number(ctx.stash.id);

        // Look up the record so we can delete the file from disk
        const record = uploadsModel.getUpload(uploadId);
        if (record != null && record.userId === session.userId) {
            uploadsModel.deleteUpload(uploadId, session.userId);
            // Remove the file from disk (ignore errors if already gone)
            try { fs.unlinkSync(record.savedPath); } catch { /* file may already be gone */ }
        }

        // Return empty body — htmx will remove the target element
        await ctx.render({ text: '' });
    }
}
