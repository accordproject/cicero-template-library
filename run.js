/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const CodeGen = require('@accordproject/concerto-codegen').CodeGen;
const FileWriter = require('@accordproject/concerto-util').FileWriter;

const HtmlTransformer = require('@accordproject/markdown-html').HtmlTransformer;
const CiceroMarkTransformer = require('@accordproject/markdown-cicero').CiceroMarkTransformer;

const Template = require('@accordproject/cicero-core').Template;
const rimraf = require('rimraf');
const path = require('path');
const nunjucks = require('nunjucks');
const plantumlEncoder = require('plantuml-encoder');
const showdown = require('showdown');
const uuidv1 = require('uuid/v1');
const semver = require('semver');
const LZString = require('lz-string');
const pLimit = require('p-limit');

const BUILD_CONCURRENCY = Number(process.env.BUILD_CONCURRENCY) || 8;

const {
    promisify
} = require('util');
const {
    resolve
} = require('path');
const fs = require('fs-extra')
const readdir = promisify(fs.readdir);
const rename = promisify(fs.rename);
const stat = promisify(fs.stat);
const mkdirp = require('mkdirp');
const writeFile = promisify(fs.writeFile);
const jsdom = require("jsdom");
const jquery = require("jquery");

/**
 * GLOBALS
 */
const rootDir = resolve(__dirname, './src');
const buildDir = resolve(__dirname, './build/');
const archiveDir = resolve(__dirname, './build/archives');
const serverRoot = process.env.SERVER_ROOT ? process.env.SERVER_ROOT : 'https://templates.accordproject.org';
const playgroundRoot = 'https://playground.accordproject.org';
const githubRoot = `https://github.dev/accordproject/cicero-template-library/blob/master`;

const ciceroMark = new CiceroMarkTransformer();
const htmlMark = new HtmlTransformer();

nunjucks.configure('./views', {
    autoescape: false,
});

/**
 * Generating a static website from a template library
 *
 * - Scans the 'src' directory for templates
 * - Loads each template using Template.fromDirectory
 * - Runs any tests for the templates that are in the `test` directory for the template using Mocha
 * - Generates an archive for the template and saves to the 'build/archives' directory
 * - Generates HTML and other resources for the template
 * - Generates an index.html and json file for all the templates
 *
 * Options (environment variables):
 * - SKIP_GENERATION : do not write anything to disk
 * - SKIP_TESTS : do not run the unit tests
 * - SKIP_DROPDOWNS : do not regenerate update dropdowns on old html versions to point to the latest releases
 * - DELETE_ALL : clear the build directory. Use with extreme caution as all old versions of templates
 *                will be removed from the build archives folder!
 * - FORCE_CREATE_ARCHIVE : regenerate an existing archive even if it exists. Warning the new archive
 *                          may change because it will re-download external dependencies
 * Options (command line)
 * - template name (only this template gets built)
 */
(async function () {
    try {
        const templateArgs = process.argv.slice(2);
        const templateName = templateArgs.length > 0 ? templateArgs[0] : null;
        if (templateName) {
            console.log('Only building template: ' + templateName);
        }

        if (process.env.DELETE_ALL) {
            // delete build directory
            rimraf.sync(buildDir);
        }

        const templateIndex = await buildTemplates(templateUnitTester, templatePageGenerator, templateName);

        if (!process.env.SKIP_GENERATION) {
            // copy the logo to build directory
            await fs.copy('assets', './build/assets');
            await fs.copy('styles.css', './build/styles.css');
            await fs.copy('_headers', './build/_headers');

            // get the latest versions of each template
            const latestIndex = filterTemplateIndex(templateIndex);

            // group templates by tag for the index page (archived templates are excluded)
            const groupedByTag = {};
            const archivedTemplates = {};
            for (const [id, entry] of Object.entries(latestIndex)) {
                if (entry.archived) {
                    archivedTemplates[id] = entry;
                    continue;
                }
                const tags = (entry.tags && entry.tags.length) ? entry.tags : ['untagged'];
                for (const tag of tags) {
                    if (!groupedByTag[tag]) groupedByTag[tag] = {};
                    groupedByTag[tag][id] = entry;
                }
            }
            const tagOrder = ['finance', 'sales', 'vendor', 'shipping', 'real-estate', 'intellectual-property', 'services', 'HR', 'reference', 'untagged'];
            const sortedTags = Object.keys(groupedByTag).sort((a, b) => {
                const ai = tagOrder.indexOf(a);
                const bi = tagOrder.indexOf(b);
                if (ai !== -1 && bi !== -1) return ai - bi;
                if (ai !== -1) return -1;
                if (bi !== -1) return 1;
                return a.localeCompare(b);
            });
            const groupedSorted = sortedTags.map(tag => ({ tag, templates: groupedByTag[tag] }));

            // generate the index html page
            const templateResult = nunjucks.render('index.njk', {
                serverRoot: serverRoot,
                templateIndex: latestIndex,
                groupedByTag: groupedSorted,
                archivedTemplates: archivedTemplates,
            });
            await writeFile('./build/index.html', templateResult);
        }
    }
    catch (err) {
        console.log(err);
    }
})();

/**
 * Returns a template index that only contains the latest version
 * of each template
 *
 * @param {object} templateIndex - the template index
 * @returns {object} a new template index that only contains the latest version of each template
 */
function filterTemplateIndex(templateIndex) {
    const result = {};
    const nameToVersion = {};

    // build a map of the latest version of each template
    for (let template of Object.keys(templateIndex)) {
        const atIndex = template.indexOf('@');
        const name = template.substring(0, atIndex);
        const version = template.substring(atIndex + 1);

        const existingVersion = nameToVersion[name];

        if (!existingVersion || semver.lt(existingVersion, version)) {
            nameToVersion[name] = version;
        }
    }

    // now build the result
    for (let name in nameToVersion) {
        const id = `${name}@${nameToVersion[name]}`;
        result[id] = templateIndex[id];
    }

    return result;
}

/**
 * Get all the files beneath a subdirectory
 *
 * @param {String} dir - the root directory
 */
async function getFiles(dir) {
    const subdirs = await readdir(dir);
    const files = await Promise.all(subdirs.map(async (subdir) => {
        const res = resolve(dir, subdir);
        return (await stat(res)).isDirectory() ? getFiles(res) : res;
    }));
    return files.reduce((a, f) => a.concat(f), []);
}

/**
 * Builds all the templates and copies the valid templates
 * to the ./build/archives directory
 * @param {Function} preProcessor - a function that is called for each valid template
 * @param {Function} postProcessor - a function that is called for each valid template (after the preProcessor)
 * @param {String} [selectedTemplate] - optional name of a template. If specified this is the only template that is built
 * @returns {Object} the index of clause and contract templates
 */
async function buildTemplates(preProcessor, postProcessor, selectedTemplate) {

    // load the index
    const templateLibraryPath = `${buildDir}/template-library.json`;
    let templateIndex = {};
    const indexExists = await fs.pathExists(templateLibraryPath);

    if (indexExists) {
        const indexContent = fs.readFileSync(templateLibraryPath, 'utf8');
        templateIndex = JSON.parse(indexContent);
    }

    const files = await getFiles(rootDir);

    // Collect the package.json files that look like templates.
    const candidates = [];
    for (const file of files) {
        const fileName = path.basename(file);
        if (fileName !== 'package.json' || file.indexOf('/node_modules/') !== -1) continue;
        if (selectedTemplate) {
            const pkgJson = JSON.parse(fs.readFileSync(file, 'utf8'));
            if (pkgJson.name !== selectedTemplate) continue;
        }
        candidates.push(file);
    }

    await fs.ensureDir(archiveDir);
    const limit = pLimit(BUILD_CONCURRENCY);

    // Per-template work runs in parallel under a bounded pool. Each task
    // returns a patch describing what should be merged into templateIndex,
    // so the shared index is only mutated serially after the pool drains.
    const tasks = candidates.map(file => limit(async () => {
        const templatePath = path.dirname(file);
        const dest = templatePath.replace('/src/', '/build/');
        console.log(`Processing ${templatePath}`);
        try {
            const template = await Template.fromDirectory(templatePath);
            await preProcessor(templatePath, template);

            if (process.env.SKIP_GENERATION) return null;

            const destPath = path.dirname(dest);
            await fs.ensureDir(destPath);
            const archiveFileName = `${template.getIdentifier()}.cta`;
            const archiveFilePath = `${archiveDir}/${archiveFileName}`;
            const ciceroArchiveFileName = `${template.getIdentifier()}-cicero.cta`;
            const ciceroArchiveFilePath = `${archiveDir}/${ciceroArchiveFileName}`;

            const htmlFilePath = `${buildDir}/${template.getIdentifier()}.html`;
            const [archiveFileExists, ciceroArchiveFileExists, htmlFileExists] = await Promise.all([
                fs.pathExists(archiveFilePath),
                fs.pathExists(ciceroArchiveFilePath),
                fs.pathExists(htmlFilePath),
            ]);

            if (!ciceroArchiveFileExists || process.env.FORCE_CREATE_ARCHIVE) {
                const ciceroArchive = await template.toArchive('es6');
                await writeFile(ciceroArchiveFilePath, ciceroArchive);
                console.log('Copied: ' + ciceroArchiveFilePath);
            }
            if (!archiveFileExists || process.env.FORCE_CREATE_ARCHIVE) {
                const tsArchive = await template.toArchive('typescript');
                await writeFile(archiveFilePath, tsArchive);
                console.log('Copied: ' + archiveFileName);
            }

            const m = template.getMetadata();
            let tags = [];
            let archived = false;
            try {
                const rawPkg = JSON.parse(fs.readFileSync(file, 'utf8'));
                if (Array.isArray(rawPkg.tags)) tags = rawPkg.tags;
                if (rawPkg.archived === true) archived = true;
            } catch (e) { /* ignore */ }

            const regenerated = !ciceroArchiveFileExists || !archiveFileExists || !htmlFileExists || process.env.FORCE_CREATE_ARCHIVE;
            const indexData = {
                uri: `ap://${template.getIdentifier()}#${template.getHash()}`,
                url: `${serverRoot}/archives/${archiveFileName}`,
                ciceroUrl: `${serverRoot}/archives/${ciceroArchiveFileName}`,
                name: m.getName(),
                displayName: m.getDisplayName(),
                description: m.getDescription(),
                version: m.getVersion(),
                ciceroVersion: m.getCiceroVersion(),
                type: m.getTemplateType(),
                logo: m.getLogo() ? m.getLogo().toString('base64') : null,
                author: m.getAuthor() ? m.getAuthor() : null,
                tags,
                ...(archived && { archived: true }),
            };
            if (!regenerated) console.log(`Skipped: ${archiveFileName} (already exists).`);
            return { templatePath, template, indexData, regenerated };
        } catch (err) {
            console.log(err);
            console.log(`Failed processing ${file} with ${err}`);
            return null;
        }
    }));

    const results = (await Promise.all(tasks)).filter(Boolean);

    // Merge per-template index data serially so write order is deterministic.
    for (const r of results) {
        templateIndex[r.template.getIdentifier()] = r.indexData;
    }

    // Apply archived flag from package.json to all index entries by template name.
    // This runs after the build loop so it covers templates that failed to build
    // (whose existing index entries are carried forward unchanged).
    const currentNames = new Set();
    for (const file of candidates) {
        try {
            const rawPkg = JSON.parse(fs.readFileSync(file, 'utf8'));
            currentNames.add(rawPkg.name);
            if (rawPkg.archived !== true) continue;
            const name = rawPkg.name;
            for (const [id, entry] of Object.entries(templateIndex)) {
                if (id.startsWith(name + '@')) {
                    entry.archived = true;
                }
            }
        } catch (e) { /* ignore */ }
    }

    // Mark orphaned entries (templates removed/renamed from src/) as archived
    // so they don't appear on the home page as untagged active templates.
    for (const [id, entry] of Object.entries(templateIndex)) {
        const name = id.substring(0, id.indexOf('@'));
        if (!currentNames.has(name)) {
            entry.archived = true;
        }
    }

    // Run the page generator + dropdown patches sequentially against the
    // now-stable templateIndex. This is the cheap, ordering-sensitive pass.
    for (const r of results) {
        if (r.regenerated) {
            await postProcessor(templateIndex, r.templatePath, r.template);
        }
        await patchDropdowns(r.template);
    }

    // Group templates by name and generate landing pages
    if (!process.env.SKIP_GENERATION) {
        const templatesByName = {};
        for (const [id, entry] of Object.entries(templateIndex)) {
            const atIndex = id.indexOf('@');
            const name = id.substring(0, atIndex);
            if (!templatesByName[name]) {
                templatesByName[name] = [];
            }
            templatesByName[name].push({ id, entry });
        }

        // Generate a landing page for each template name
        for (const [name, versions] of Object.entries(templatesByName)) {
            await landingPageGenerator(serverRoot, name, versions);
        }
    }

    // save the index
    await writeFile(templateLibraryPath, JSON.stringify(templateIndex, null, 4));

    return templateIndex;
};

/**
 * Update the version-dropdown (and optional VSCode-button injection) on every
 * already-rendered HTML page for this template. Runs sequentially per template
 * but every callsite uses fs.promises so it doesn't fire-and-forget.
 */
async function patchDropdowns(template) {
    if (process.env.SKIP_GENERATION) return;
    if (process.env.SKIP_DROPDOWNS && !process.env.ADD_VSCODE_BUTTON) return;

    // load the persisted index once per call so we see every freshly-merged version
    const templateLibraryPath = `${buildDir}/template-library.json`;
    let templateIndex = {};
    if (await fs.pathExists(templateLibraryPath)) {
        templateIndex = JSON.parse(await fs.promises.readFile(templateLibraryPath, 'utf8'));
    }

    const templateVersions = Object.keys(templateIndex).filter(item => {
        const atIndex = item.indexOf('@');
        return item.substring(0, atIndex) === template.getName();
    }).sort((a, b) => {
        const versionA = a.substring(a.indexOf('@') + 1);
        const versionB = b.substring(b.indexOf('@') + 1);
        return semver.rcompare(versionA, versionB);
    });

    for (const versionToUpdate of templateVersions) {
        const htmlPath = `build/${versionToUpdate}.html`;
        let data;
        try {
            data = await fs.promises.readFile(htmlPath, 'utf8');
        } catch (err) {
            console.log(`Failed reading ${htmlPath} with ${err}`);
            continue;
        }
        const templateResult = nunjucks.render('dropdown.njk', {
            identifier: versionToUpdate,
            templateVersions,
        });
        const dom = new jsdom.JSDOM(data);
        const $ = jquery(dom.window);
        if (!process.env.SKIP_DROPDOWNS) {
            const dropdownContentElement = $('.dropdown-content');
            if (dropdownContentElement.length) {
                dropdownContentElement.html(templateResult);
            }
        }
        if (process.env.ADD_VSCODE_BUTTON) {
            const openStudio = $('a.button.open-studio');
            if (openStudio.length) {
                const githubURL = `${githubRoot}/src/${encodeURIComponent(template.getName())}/README.md`;
                openStudio.after(`\n<a href="${githubURL}" class="button is-rounded is-primary open-studio">Open in VSCode Web</a>`);
            }
        }
        try {
            await fs.promises.writeFile(htmlPath, dom.serialize());
            console.log(`Updated dropdown in ${htmlPath}`);
        } catch (err) {
            console.log(`Failed saving ${htmlPath} with ${err}`);
        }
    }
}

/**
 * Runs the standard tests for a template
 * @param {String} templatePath - the location of the template on disk
 * @param {Template} template
 */
async function templateUnitTester(templatePath, template) {
    // Cicero 0.26 removed natural-language sample parsing, so loading the
    // template via Template.fromDirectory is the validation we get.
}

/**
 * Generate a sample instance for a template's type
 * @param {Template} template the template
 * @param {string} type the fully qualified type name
 */
function sampleInstance(template, type) {

    // generate the sample json instances
    const sampleGenerationOptions = {};
    sampleGenerationOptions.generate = true;
    sampleGenerationOptions.includeOptionalFields = true;

    const classDecl = template.getModelManager().getType(type);

    let result = {};
    result.abstract = 'this is an abstract type';

    if (!classDecl.isAbstract()) {
        if (classDecl.getIdentifierFieldName()) {
            result = template.getFactory().newResource(classDecl.getNamespace(), classDecl.getName(), uuidv1(), sampleGenerationOptions);
        } else {
            result = template.getFactory().newResource(classDecl.getNamespace(), classDecl.getName(), null, sampleGenerationOptions);
        }
    }

    return result;
}

/**
 * Generates html and other resources from a valid template
 * @param {object} templateIndex - the existing template index
 * @param {String} templatePath - the location of the template on disk
 * @param {Template} template
 */
async function templatePageGenerator(templateIndex, templatePath, template) {

    console.log(`Generating html for ${templatePath}`);

    const archiveFileName = `${template.getIdentifier()}.cta`;
    const archiveFilePath = `${archiveDir}/${archiveFileName}`;
    const templatePageHtml = archiveFileName.replace('.cta', '.html');
    const pumlFilePath = `${buildDir}/${template.getIdentifier()}.puml`;
    // generate UML
    const modelDecls = template.getTemplateModel().getModelFile();
    const models = template.getModelManager().getModels();
    const modelFile = models[models.length - 1].content;
    const visitor = new CodeGen.PlantUMLVisitor();
    const fileWriter = new FileWriter(buildDir);

    fileWriter.openFile(pumlFilePath);
    fileWriter.writeLine(0, '@startuml');
    const params = { fileWriter: fileWriter };
    modelDecls.accept(visitor, params);
    fileWriter.writeLine(0, '@enduml');
    fileWriter.closeFile();
    const pumlContent = fs.readFileSync(pumlFilePath, 'utf8');
    const encoded = plantumlEncoder.encode(pumlContent);
    const umlURL = `https://www.plantuml.com/plantuml/svg/${encoded}`;
    const umlCardURL = `https://www.plantuml.com/plantuml/png/${encoded}`;
    const githubURL = `${githubRoot}/src/${encodeURIComponent(template.getName())}/README.md`;

    const converter = new showdown.Converter();
    const readmeHtml = converter.makeHtml(template.getMetadata().getREADME());

    // Cicero 0.26 no longer parses sample markdown back to JSON. If a
    // committed sample.json exists (bootstrapped from older archives),
    // use it; otherwise generate a synthetic instance from the model.
    const sampleJsonPath = path.join(templatePath, 'sample.json');
    let sampleInstanceText;
    if (fs.existsSync(sampleJsonPath)) {
        sampleInstanceText = fs.readFileSync(sampleJsonPath, 'utf8');
    } else {
        const classDecl = template.getTemplateModel();
        sampleInstanceText = JSON.stringify(sampleInstance(template, classDecl.getFullyQualifiedName()), null, 4);
    }

    const safeSample = (type) => {
        try { return JSON.stringify(sampleInstance(template, type), null, 4); }
        catch (e) { return `// sample generation failed: ${e.message}`; }
    };

    const requestTypes = {};
    for (let type of template.getRequestTypes()) {
        requestTypes[type] = safeSample(type);
    }

    const responseTypes = {};
    for (let type of template.getResponseTypes()) {
        responseTypes[type] = safeSample(type);
    }

    const stateTypes = {}
    for (let type of template.getStateTypes()) {
        stateTypes[type] = safeSample(type);
    }

    const eventTypes = {}
    for (let type of template.getEmitTypes()) {
        eventTypes[type] = safeSample(type);
    }

    // get all the versions of the template (sorted by semver, newest first)
    const templateVersions = Object.keys(templateIndex).filter((item) => {
        const atIndex = item.indexOf('@');
        const name = item.substring(0, atIndex);
        return name == template.getName();
    }).sort((a, b) => {
        const versionA = a.substring(a.indexOf('@') + 1);
        const versionB = b.substring(b.indexOf('@') + 1);
        return semver.rcompare(versionA, versionB);
    });

    const sample = template.getMetadata().getSample();
    const logo = template.getMetadata().getLogo() ? template.getMetadata().getLogo().toString('base64') : null;
    const author = template.getMetadata().getAuthor() ? template.getMetadata().getAuthor() : null;
    const grammarPath = path.join(templatePath, 'text', 'grammar.tem.md');
    const grammar = fs.existsSync(grammarPath) ? fs.readFileSync(grammarPath, 'utf8') : '';
    let sampleHTML = htmlMark.toHtml(ciceroMark.fromMarkdown(sample, 'json'));
    // Strip the outer <html>/<head>/<body>/document wrapper that
    // @accordproject/markdown-html 0.18 emits, leaving just the inner
    // body so the snippet renders inline on the template page.
    const docMatch = sampleHTML.match(/<div class="document">([\s\S]*)<\/div>\s*<\/body>/);
    if (docMatch) {
        sampleHTML = docMatch[1];
    }

    // Build a playground.accordproject.org share link. The playground
    // reads `#data=<lz-compressed JSON>` and expects four string fields.
    const modelCto = template.getModelManager().getModels()
        .filter(m => !m.name.startsWith('@'))
        .map(m => m.content)
        .join('\n\n');
    const playgroundPayload = {
        templateMarkdown: grammar,
        modelCto,
        data: sampleInstanceText,
        agreementHtml: '',
    };
    const playgroundURL = `${playgroundRoot}/#data=${LZString.compressToEncodedURIComponent(JSON.stringify(playgroundPayload))}`;

    const templateResult = nunjucks.render('template.njk', {
        serverRoot: serverRoot,
        umlURL: umlURL,
        umlCardURL: umlCardURL,
        playgroundURL: playgroundURL,
        githubURL: githubURL,
        filePath: templatePageHtml,
        template: template,
        modelFile: modelFile,
        sample: sample,
        sampleHTML: sampleHTML,
        readmeHtml: readmeHtml,
        requestTypes: requestTypes,
        responseTypes: responseTypes,
        stateTypes: stateTypes,
        instance: sampleInstanceText,
        eventTypes: eventTypes,
        templateVersions: templateVersions,
        logo: logo,
        author: author,
        grammar: grammar,
    });
    await writeFile(`./build/${templatePageHtml}`, templateResult);
}

/**
 * Generates a landing page for a template showing all its versions
 * @param {string} serverRoot - the server root URL
 * @param {string} templateName - the template name (e.g. "acceptance-of-delivery")
 * @param {Array} versions - array of {id, entry} objects, one per version
 */
async function landingPageGenerator(serverRoot, templateName, versions) {
    console.log(`Generating landing page for ${templateName}`);

    // Sort versions by semver descending
    const sortedVersions = versions.sort((a, b) => {
        const versionA = a.id.substring(a.id.indexOf('@') + 1);
        const versionB = b.id.substring(b.id.indexOf('@') + 1);
        return semver.rcompare(versionA, versionB);
    });

    const latestId = sortedVersions[0].id;
    const latestEntry = sortedVersions[0].entry;
    const latestVersion = latestId.substring(latestId.indexOf('@') + 1);

    // Build the versions list for the template, filtering to only versions with HTML files
    const versionsList = [];
    for (const v of sortedVersions) {
        const version = v.id.substring(v.id.indexOf('@') + 1);
        const htmlPath = path.join(buildDir, `${v.id}.html`);
        // Only include versions that have HTML files (backward compatibility with old builds)
        if (await fs.pathExists(htmlPath)) {
            versionsList.push({
                version: version,
                ciceroVersion: v.entry.ciceroVersion,
                url: `/${v.id}.html`,
                archiveUrl: `${serverRoot}/archives/${v.id}.cta`,
            });
        }
    }

    const latestVersionUrl = versionsList.length > 0 ? versionsList[0].url : '';

    // Create landing page directory
    const landingPageDir = resolve(buildDir, 't', templateName);
    await fs.ensureDir(landingPageDir);

    // Render and write the landing page HTML
    const landingResult = nunjucks.render('landing.njk', {
        serverRoot: serverRoot,
        templateName: templateName,
        displayName: latestEntry.displayName || templateName,
        description: latestEntry.description,
        templateType: latestEntry.type,
        ciceroVersion: latestEntry.ciceroVersion,
        author: latestEntry.author,
        logo: latestEntry.logo,
        latestVersion: latestVersion,
        latestVersionUrl: latestVersionUrl,
        versions: versionsList,
    });
    await writeFile(resolve(landingPageDir, 'index.html'), landingResult);
    console.log(`Created landing page: ${resolve(landingPageDir, 'index.html')}`);

    // Write versions.json for client-side consumption (future use)
    const versionsJson = {
        templateName: templateName,
        latestVersion: latestVersion,
        versions: versionsList,
    };
    await writeFile(resolve(landingPageDir, 'versions.json'), JSON.stringify(versionsJson, null, 4));
    console.log(`Created versions manifest: ${resolve(landingPageDir, 'versions.json')}`);
}
