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

const CodeGen = require('@accordproject/concerto-tools').CodeGen;
const FileWriter = require('@accordproject/concerto-tools').FileWriter;

const HtmlTransformer = require('@accordproject/markdown-html').HtmlTransformer;
const CiceroMarkTransformer = require('@accordproject/markdown-cicero').CiceroMarkTransformer;

const Template = require('@accordproject/cicero-core').Template;
const Clause = require('@accordproject/cicero-core').Clause;
const rimraf = require('rimraf');
const path = require('path');
const nunjucks = require('nunjucks');
const plantumlEncoder = require('plantuml-encoder');
const showdown = require('showdown');
const uuidv1 = require('uuid/v1');
const semver = require('semver');

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
const serverRoot = process.env.SERVER_ROOT ?  process.env.SERVER_ROOT : 'https://templates.accordproject.org';
const studioRoot = 'https://studio.accordproject.org';

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
        let templateName = process.argv.slice(2);
        if(templateName && templateName.length > 0) {
            console.log('Only building template: ' + templateName);
        } else {
            templateName = null;
        }

        if(process.env.DELETE_ALL) {
            // delete build directory
            rimraf.sync(buildDir);
        }

        const templateIndex = await buildTemplates(templateUnitTester, templatePageGenerator, templateName );

        if(!process.env.SKIP_GENERATION) {
            // copy the logo to build directory
            await fs.copy('assets', './build/assets');
            await fs.copy('styles.css', './build/styles.css');
            await fs.copy('_headers', './build/_headers');

            // get the latest versions of each template
            const latestIndex = filterTemplateIndex(templateIndex);

            // generate the index html page
            const templateResult = nunjucks.render('index.njk', {
                serverRoot: serverRoot,
                templateIndex: latestIndex,
            });
            await writeFile('./build/index.html', templateResult);
        }
    }
    catch(err) {
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
    for(let template of Object.keys(templateIndex)) {
        const atIndex = template.indexOf('@');
        const name = template.substring(0,atIndex);
        const version  = template.substring(atIndex+1);

        const existingVersion = nameToVersion[name];

        if(!existingVersion || semver.lt(existingVersion, version)) {
            nameToVersion[name] = version;
        }
    }

    // now build the result
    for(let name in nameToVersion) {
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

    if(indexExists) {
        const indexContent = fs.readFileSync(templateLibraryPath, 'utf8');
        templateIndex = JSON.parse(indexContent);
    }

    const files = await getFiles(rootDir);

    for (const file of files) {
        const fileName = path.basename(file);
        let selected = false;

        // assume all package.json files that are not inside node_modules are templates
        if (fileName === 'package.json' && file.indexOf('/node_modules/') === -1) {
            selected = true;
        }

        // unless a given template name has been specified
        if(selected && selectedTemplate) {
            const packageJson = fs.readFileSync(file, 'utf8');
            const pkgJson = JSON.parse(packageJson);
            if(pkgJson.name != selectedTemplate) {
                selected = false;
            }
        }

        if(selected) {
            // read the parent directory as a template
            const templatePath = path.dirname(file);
            console.log(`Processing ${templatePath}`);
            const dest = templatePath.replace('/src/', '/build/');
            await fs.ensureDir(archiveDir);

            try {
                const template = await Template.fromDirectory(templatePath);

                // call the pre template processor
                await preProcessor(templatePath, template);

                if(!process.env.SKIP_GENERATION) {
                    if (!process.env.SKIP_DROPDOWNS) {
                      const templateVersions = Object.keys(templateIndex).filter(
                        item => {
                          const atIndex = item.indexOf("@");
                          const name = item.substring(0, atIndex);
                          return name == template.getName();
                        }
                      );

                      templateVersions.forEach(versionToUpdate => {
                        const templateResult = nunjucks.render("dropdown.njk", {
                          identifier: versionToUpdate,
                          templateVersions: templateVersions,
                        });
                        fs.readFile(
                          "build/" + versionToUpdate + ".html",
                          "utf8",
                          (err, data) => {
                            if (err) {
                              console.log(`Failed reading build/${versionToUpdate}.html with ${err}`);
                            }
                            const dom = new jsdom.JSDOM(data);
                            const $ = jquery(dom.window);
                            const dropdownContentElement = $(".dropdown-content");
                            if (dropdownContentElement.length) {
                              $(".dropdown-content").html(templateResult);
                              fs.writeFile(
                                "build/" + versionToUpdate + ".html",
                                dom.serialize(),
                                err => {
                                  if (err) {
                                      console.log(`Failed saving build/${versionToUpdate}.html with ${err}`);
                                  } else {
                                      console.log("dropdown updated for template: " + "build/" + versionToUpdate + ".html" );
                                  }
                                }
                              );
                            }
                          }
                        );
                      });
                    }
                    // get the name of the generated archive
                    const destPath = path.dirname(dest);
                    await fs.ensureDir(destPath);
                    const archiveFileName = `${template.getIdentifier()}.cta`;
                    const archiveFilePath = `${archiveDir}/${archiveFileName}`;
                    const archiveFileExists = await fs.pathExists(archiveFilePath);

                    if(!archiveFileExists || process.env.FORCE_CREATE_ARCHIVE) {
                        let archive;
                        archive = await template.toArchive('ergo');
                        await writeFile(archiveFilePath, archive);
                        console.log('Copied: ' + archiveFileName);

                        // update the index
                        const m = template.getMetadata();
                        const templateHash = template.getHash();
                        const indexData = {
                            uri: `ap://${template.getIdentifier()}#${templateHash}`,
                            url: `${serverRoot}/archives/${archiveFileName}`,
                            name : m.getName(),
                            displayName: m.getDisplayName(),
                            description : m.getDescription(),
                            version: m.getVersion(),
                            ciceroVersion: m.getCiceroVersion(),
                            type: m.getTemplateType(),
                            logo: m.getLogo() ? m.getLogo().toString('base64') : null,
                            author: m.getAuthor() ? m.getAuthor() : null,
                        }
                        templateIndex[template.getIdentifier()] = indexData;

                        // call the post template processor
                        await postProcessor(templateIndex, templatePath, template);
                    }
                    else {
                        console.log(`Skipped: ${archiveFileName} (already exists).`);
                    }
                }
            } catch (err) {
                console.log(err);
                console.log(`Failed processing ${file} with ${err}`);
            }
        }
    }

    // save the index
    await writeFile(templateLibraryPath, JSON.stringify(templateIndex, null, 4));

    // return the updated index
    return templateIndex;
};

/**
 * Runs the standard tests for a template
 * @param {String} templatePath - the location of the template on disk
 * @param {Template} template
 */
async function templateUnitTester(templatePath, template) {
    // check that all the samples parse
    const samples = template.getMetadata().getSamples();
    if(samples) {
        const sampleValues = Object.values(samples);

        // should be TemplateInstance
        const instance = new Clause(template);

        for(const s of sampleValues ) {
            instance.parse(s);
        }
    }
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
        result = template.getFactory().newResource( classDecl.getNamespace(), classDecl.getName(), uuidv1(), sampleGenerationOptions);
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
    const modelFile = models[models.length-1].content;
    const visitor = new CodeGen.PlantUMLVisitor();
    const fileWriter = new FileWriter(buildDir);

    fileWriter.openFile(pumlFilePath);
    fileWriter.writeLine(0, '@startuml');
    const params = {fileWriter : fileWriter};
    modelDecls.accept(visitor, params);
    fileWriter.writeLine(0, '@enduml');
    fileWriter.closeFile();
    const pumlContent = fs.readFileSync(pumlFilePath, 'utf8');
    const encoded = plantumlEncoder.encode(pumlContent);
    const umlURL = `https://www.plantuml.com/plantuml/svg/${encoded}`;
    const umlCardURL = `https://www.plantuml.com/plantuml/png/${encoded}`;
    const studioURL = `${studioRoot}/?template=${encodeURIComponent('ap://' + template.getIdentifier() + '#hash')}`;

    const converter = new showdown.Converter();
    const readmeHtml = converter.makeHtml(template.getMetadata().getREADME());

    let sampleInstanceText = null;

    // parse the default sample and use it as the sample instance
    const samples = template.getMetadata().getSamples();
    if(samples.default) {
        // should be TemplateInstance
        const instance = new Clause(template);
        instance.parse(samples.default);
        sampleInstanceText = JSON.stringify(instance.getData(), null, 4);
    }
    else {
        // no sample was found, so we generate one
        const classDecl = template.getTemplateModel();
        sampleInstanceText = JSON.stringify(sampleInstance(template, classDecl.getFullyQualifiedName()), null, 4);
    }

    const requestTypes = {};
    for(let type of template.getRequestTypes()) {
        requestTypes[type] = JSON.stringify(sampleInstance(template, type), null, 4);
    }

    const responseTypes = {};
    for(let type of template.getResponseTypes()) {
        responseTypes[type] = JSON.stringify(sampleInstance(template, type), null, 4);
    }

    const stateTypes = {}
    for(let type of template.getStateTypes()) {
        stateTypes[type] = JSON.stringify(sampleInstance(template, type), null, 4);
    }

    const eventTypes = {}
    for(let type of template.getEmitTypes()) {
        eventTypes[type] = JSON.stringify(sampleInstance(template, type), null, 4);
    }

    // get all the versions of the template
    const templateVersions = Object.keys(templateIndex).filter((item) => {
        const atIndex = item.indexOf('@');
        const name = item.substring(0,atIndex);
        return name == template.getName();
    });

    const sample = template.getMetadata().getSample();
    const logo = template.getMetadata().getLogo() ? template.getMetadata().getLogo().toString('base64') : null;
    const author = template.getMetadata().getAuthor() ? template.getMetadata().getAuthor() : null;
    let sampleHTML = htmlMark.toHtml(ciceroMark.fromMarkdown(sample,'json'));
    // XXX HTML cleanup hack for rendering in page. Would be best done with the right option in markdown-transform
    sampleHTML = sampleHTML.replace('<html>\n<body>\n<div class="document">','').replace('</div>\n</body>\n</html>','');

    const templateResult = nunjucks.render('template.njk', {
        serverRoot: serverRoot,
        umlURL : umlURL,
        umlCardURL : umlCardURL,
        studioURL : studioURL,
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
    });
    await writeFile(`./build/${templatePageHtml}`, templateResult);
}
