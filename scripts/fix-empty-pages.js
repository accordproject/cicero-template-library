/*
 * Script to scan `build/*.html` and replace empty pages with the `fallback.njk` rendering.
 * Usage: node scripts/fix-empty-pages.js
 */

const fs = require('fs-extra');
const path = require('path');
const nunjucks = require('nunjucks');
const jsdom = require('jsdom');

nunjucks.configure(path.resolve(__dirname, '../views'), { autoescape: false });

const buildDir = path.resolve(__dirname, '../build');
const templateIndexPath = path.join(buildDir, 'template-library.json');
const serverRoot = process.env.SERVER_ROOT ? process.env.SERVER_ROOT : 'https://templates.accordproject.org';
const studioRoot = 'https://studio.accordproject.org';
const githubRoot = `https://github.dev/accordproject/cicero-template-library/blob/master`;

async function run() {
    const files = (await fs.readdir(buildDir)).filter(f => f.endsWith('.html'));

    let templateIndex = {};
    try {
        if(await fs.pathExists(templateIndexPath)) {
            templateIndex = await fs.readJson(templateIndexPath);
        }
    } catch(e) {
        console.warn('Could not read template index:', e);
    }

    for(const f of files) {
        if(f === 'index.html') continue;
        const filePath = path.join(buildDir, f);
        let content;
        try {
            content = await fs.readFile(filePath, 'utf8');
        } catch(e) {
            console.error(`Failed reading ${filePath}:`, e);
            continue;
        }

        const dom = new jsdom.JSDOM(content);
        const bodyContent = dom.window.document && dom.window.document.body ? dom.window.document.body.innerHTML.trim() : '';
        if(!bodyContent) {
            const identifier = path.basename(f, '.html');
            console.log(`Empty page detected: ${f} (identifier: ${identifier}). Replacing with fallback.`);

            const meta = templateIndex[identifier] || {};
            const displayName = meta.displayName || identifier;
            const description = meta.description || '';
            const archiveURL = `./archives/${identifier}.cta`;
            const studioURL = `${studioRoot}/?template=${encodeURIComponent('ap://' + identifier + '#hash')}`;
            const githubURL = `${githubRoot}/src/${encodeURIComponent(identifier.split('@')[0])}/README.md`;

            const fallbackHtml = nunjucks.render('fallback.njk', {
                serverRoot: serverRoot,
                filePath: f,
                identifier: identifier,
                displayName: displayName,
                description: description,
                studioURL: studioURL,
                githubURL: githubURL,
                archiveURL: archiveURL,
                umlCardURL: `${serverRoot}/assets/images/A-MARK-ACCORDPROJECT-ONELINE-white.svg`
            });

            try {
                await fs.writeFile(filePath, fallbackHtml);
                console.log(`Replaced ${f} with fallback page.`);
            } catch(e) {
                console.error(`Failed writing ${filePath}:`, e);
            }
        }
    }
}

run().catch(e => {
    console.error('Script failed:', e);
    process.exit(1);
});
