import type { MojoContext } from '@mojojs/core';
import { saveFile } from '../fileStore.js';
import { Uploads } from '../models/uploads.js';

const UPLOAD_DIR = 'uploads';

export default class Controller {
    // Render the upload form
    async uploadPage(ctx: MojoContext): Promise<void> {
        await ctx.render();
    }

    // Handle file upload: save to disk, record in database, show result
    async uploadAction(ctx: MojoContext): Promise<void> {
        const session = await ctx.session();
        const uploadsModel = ctx.models.uploads as Uploads;

        const saved = await saveFile(ctx, UPLOAD_DIR, 'file');
        if (saved == null) {
            ctx.stash.error = 'No file was uploaded.';
            await ctx.render();
            return;
        }

        // Store the upload record linked to the logged-in user
        const record = uploadsModel.insertUpload(session.userId, saved);
        ctx.stash.upload = record;
        await ctx.render();
    }
}
