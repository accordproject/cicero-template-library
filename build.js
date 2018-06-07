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

const CodeGen = require('composer-common').CodeGen;
const Template = require('@accordproject/cicero-core').Template;
const rimraf = require('rimraf');
const path = require('path');
const nunjucks = require('nunjucks');

const plantumlEncoder = require('plantuml-encoder');
const showdown = require('showdown');

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


/**
 * GLOBALS
 */
const rootDir = resolve(__dirname, './src');
const buildDir = resolve(__dirname, './build/');
const archiveDir = resolve(__dirname, './build/archives');
const stagingDir = resolve(__dirname, './archives');

nunjucks.configure('./views', {
    autoescape: false
});


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
 * @returns {Object} the index of clause and contract templates
 */
async function buildTemplates(preProcessor, postProcessor) {

    // load the index
    const templateLibraryPath = `${buildDir}/template-library.json`
    let templateIndex = {};
    const indexExists = await fs.pathExists(templateLibraryPath)

    if(indexExists) {
        const indexContent = fs.readFileSync(templateLibraryPath, 'utf8');
        templateIndex = JSON.parse(indexContent);    
    }

    const files = await getFiles(rootDir);

    const clauseIndex = [];
    const contractIndex = [];

    for (const file of files) {
        const fileName = path.basename(file);
        const filePath = path.dirname(fileName);

        if (fileName === 'package.json' && file.indexOf('/node_modules/') === -1) {
            // read the parent directory as a template
            const templatePath = path.dirname(file);
            const dest = templatePath.replace('/src/', '/build/');
            await fs.ensureDir(archiveDir);

            try {
                const template = await Template.fromDirectory(templatePath);

                // call the pre template processor
                await preProcessor(templatePath, template);

                const archive = await template.toArchive();
                const destPath = path.dirname(dest);
                const relative = destPath.slice(buildDir.length);
                const fileNameNoExt = path.parse(fileName).name;

                await fs.ensureDir(destPath);
                const archiveFileName = `${template.getIdentifier()}.cta`;
                const archiveFilePath = `${archiveDir}/${archiveFileName}`;
                await writeFile(archiveFilePath, archive);
                console.log('Copied: ' + archiveFileName);

                // update the index
                const m = template.getMetadata();
                const indexData = {
                    name : m.getName(),
                    description : m.getDescription(),
                    version: m.getVersion(),
                    ciceroVersion: m.getTargetVersion(),
                    type: m.getTemplateType()
                }
                templateIndex[template.getIdentifier()] = indexData;

                // call the post template processor
                await postProcessor(templatePath, template);
            } catch (err) {
                console.log(err);
                console.log(`Failed processing ${file} with ${err}`);
            }
        }
    }

    // save the index
    await writeFile(templateLibraryPath, JSON.stringify(templateIndex));

    // return the updated index
    return templateIndex;
};

/**
 * Runs the unit tests for a template
 * @param {String} templatePath - the location of the template on disk
 * @param {Template} template 
 */
async function templateUnitTester(templatePath, template) {
    // console.log('Testing ' + template.getIdentifier());
}

/**
 * Generates assets from a valid template
 * @param {String} templatePath - the location of the template on disk
 * @param {Template} template 
 */
async function templatePageGenerator(templatePath, template) {

    const archiveFileName = `${template.getIdentifier()}.cta`;
    const archiveFilePath = `${archiveDir}/${archiveFileName}`;
    const templatePageHtml = archiveFileName.replace('.cta', '.html');
    const pumlFilePath = `${buildDir}/${template.getIdentifier()}.puml`;

    // generate UML
    const modelFile = template.getTemplateModel().getModelFile();
    const visitor = new CodeGen.PlantUMLVisitor();
    const fileWriter = new CodeGen.FileWriter(buildDir);

    fileWriter.openFile(pumlFilePath);
    fileWriter.writeLine(0, '@startuml');
    const params = {fileWriter : fileWriter};
    modelFile.accept(visitor, params);
    fileWriter.writeLine(0, '@enduml');
    fileWriter.closeFile();
    const pumlContent = fs.readFileSync(pumlFilePath, 'utf8');
    const encoded = plantumlEncoder.encode(pumlContent)
    const umlURL = `http://www.plantuml.com/plantuml/svg/${encoded}`;

    const converter = new showdown.Converter();
    const readmeHtml = converter.makeHtml(template.getMetadata().getREADME());
    const serverRoot = process.env.SERVER_ROOT;
    const templateResult = nunjucks.render('template.njk', {
        serverRoot: serverRoot,
        umlURL : umlURL,
        filePath: templatePageHtml,
        template: template,
        readmeHtml: readmeHtml
    });
    await writeFile(`./build/${templatePageHtml}`, templateResult);
}

(async function () {
    try {
        // delete build directory
        // rimraf.sync(buildDir);

        nunjucks.configure('./views', {
            autoescape: false
        });

        // copy the logo to build directory
        await fs.copy('accord_logo.png', './build/accord_logo.png');

        const templateIndex = await buildTemplates(templateUnitTester, templatePageGenerator );

        // generate the index html page
        const serverRoot = process.env.SERVER_ROOT;
        const templateResult = nunjucks.render('index.njk', {
            serverRoot: serverRoot,
            templateIndex: templateIndex
        });
        await writeFile('./build/index.html', templateResult);
    }
    catch(err) {
        console.log(err);
    }
})();