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
const Mocha = require('mocha');
const plantumlEncoder = require('plantuml-encoder');
const showdown = require('showdown');
const uuidv1 = require('uuid/v1');

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

nunjucks.configure('./views', {
    autoescape: false
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
 * - DELETE_ALL : clear the build directory. Use with extreme caution as all old versions of templates 
 *                will be removed from the build archives folder!
 * 
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
            await fs.copy('accord_logo.png', './build/accord_logo.png');

            // generate the index html page
            const serverRoot = process.env.SERVER_ROOT;
            const templateResult = nunjucks.render('index.njk', {
                serverRoot: serverRoot,
                templateIndex: templateIndex
            });
            await writeFile('./build/index.html', templateResult);
        }
    }
    catch(err) {
        console.log(err);
    }
})();


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
    const templateLibraryPath = `${buildDir}/template-library.json`
    let templateIndex = {};
    const indexExists = await fs.pathExists(templateLibraryPath)

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
                    const archive = await template.toArchive();
                    const destPath = path.dirname(dest);
    
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
                }
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

    if(process.env.SKIP_TESTS) {
        console.log(`Skipping tests for ${templatePath}`);
        return;
    }

    console.log(`Running tests for ${templatePath}`);
    
    // Instantiate a Mocha instance.
    var mocha = new Mocha({
        timeout: 10000
    });

    var testDir = templatePath + '/test';

    // Add each .js file to the mocha instance
    fs.readdirSync(testDir).filter(function(file){
        // Only keep the .js files
        return file.substr(-3) === '.js';

    }).forEach(function(file){
        mocha.addFile(
            path.join(testDir, file)
        );
    });

    // Run the tests
    mocha.run(function(failures){
        if(failures) {
            process.exitCode = failures ? -1 : 0;  // exit with non-zero status if there were failures
            throw new Error('Test failed for ' + templatePath);
        }
    });
}

/**
 * Generates html and other resources from a valid template
 * @param {String} templatePath - the location of the template on disk
 * @param {Template} template 
 */
async function templatePageGenerator(templatePath, template) {

    console.log(`Generating html for ${templatePath}`);

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

    // generate the sample json instances
    const sampleGenerationOptions = {};
    sampleGenerationOptions.generate = true;
    sampleGenerationOptions.includeOptionalFields = true;

    const classDecl = template.getTemplateModel();
    const sampleInstance = template.getFactory().newResource( classDecl.getNamespace(), classDecl.getName(), uuidv1(), sampleGenerationOptions);
    const instance = JSON.stringify(sampleInstance, null, 4);

    const requestTypes = {};
    for(let type of template.getRequestTypes()) {
        const classDecl = template.getModelManager().getType(type);
        const sampleInstance = template.getFactory().newResource( classDecl.getNamespace(), classDecl.getName(), uuidv1(), sampleGenerationOptions);
        requestTypes[type] = JSON.stringify(sampleInstance, null, 4);
    }

    const responseTypes = {};
    for(let type of template.getResponseTypes()) {
        const classDecl = template.getModelManager().getType(type);
        const sampleInstance = template.getFactory().newResource( classDecl.getNamespace(), classDecl.getName(), uuidv1(), sampleGenerationOptions);
        responseTypes[type] = JSON.stringify(sampleInstance, null, 4);
    }

    const state = JSON.stringify({ state: 'tbd'}, null, 4);
    const eventTypes = {}

    const templateResult = nunjucks.render('template.njk', {
        serverRoot: serverRoot,
        umlURL : umlURL,
        filePath: templatePageHtml,
        template: template,
        readmeHtml: readmeHtml,
        requestTypes: requestTypes,
        responseTypes: responseTypes,
        state: state,
        instance: instance,
        eventTypes: eventTypes
    });
    await writeFile(`./build/${templatePageHtml}`, templateResult);
}