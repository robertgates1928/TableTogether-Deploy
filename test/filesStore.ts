import { app } from '../lib/index.js';
import t from 'tap';
import { saveFiles, FileSet } from '../lib/fileStore.js';
import { existsSync, readFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { first, last } from "radashi";
import { Nullable } from 'tough-cookie';

app.log.level = 'debug';

const testPath = path.join('test_temp', "fileStore");

const uploadMeta: FileSet[][] = [];

app.post('/upload', async (ctx) => {
    const files = await saveFiles(ctx, testPath);
    uploadMeta.push(files);
    ctx.render({ json: { files: files } })
});

await t.test('Upload testing', async t => {
    const ua = await app.newTestUserAgent({ tap: t });

    const cleanUpTasks: Promise<void>[] = [];
    {
        const testFileName = 'test.txt';
        const testFileContent = 'Hello Mojo!';

        await t.test('upload text', async () => {
            (await ua.postOk('/upload', { formData: { fieldA: 'first value', fieldB: 'second value', fieldC: { content: testFileContent, filename: testFileName } } }))
                .statusIs(200)
                .typeLike(RegExp("json"))
        });

        const fileMeta = last(uploadMeta, []);

        if (fileMeta.length > 0) {
            const testFilePath = orDefault(first(fileMeta)?.destinationPath, testFileName);
            t.ok(existsSync(testFilePath), "Text file was created on file system");
            t.same(readFileSync(testFilePath, { encoding: "utf-8" }), testFileContent, "Text file has content transmitted through post request");
            
            cleanUpTasks.push(fs.rm(testFilePath));
        }
        else {
            t.fail("No files returned from upload action")
        }
        
        
    }

    // 
    // Bin Testing
    //
    {
        const testFileName = 'test_data/lfs-image-test.png';
        const testFileContent = readFileSync(testFileName);

        await t.test('upload binary', async () => {
            (await ua.postOk('/upload', { formData: { fieldA: 'first value', fieldB: 'second value', fieldC: { content: testFileContent, filename: testFileName } } }))
                .statusIs(200)
                .typeLike(RegExp("json"));
        });

        const fileMeta = last(uploadMeta, []);

        if (fileMeta.length > 0) {
            const testFilePath = orDefault(first(fileMeta)?.destinationPath, testFileName);
            t.ok(existsSync(testFilePath), "Binary file was created on file system");
            t.same(readFileSync(testFilePath), testFileContent, "Binary file has content transmitted through post request");
            cleanUpTasks.push(fs.rm(testFilePath));
        }
        else {
            t.fail("No files returned from upload action")
        }

        
    }

    await Promise.all([ua.stop(), ...cleanUpTasks]);
    
})

function orDefault<T>(val: Nullable<T>, def: T): T {
    return val ?? def
}