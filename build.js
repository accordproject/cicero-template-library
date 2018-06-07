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

const ModelManager = require('composer-common').ModelManager;
const ModelFile = require('composer-common').ModelFile;
const CodeGen = require('composer-common').CodeGen;
const Template = require('@accordproject/cicero-core').Template;
const rimraf = require('rimraf');
const path = require('path');
const nunjucks = require('nunjucks');
const AdmZip = require('adm-zip');

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

async function getFiles(dir) {
    const subdirs = await readdir(dir);
    const files = await Promise.all(subdirs.map(async (subdir) => {
        const res = resolve(dir, subdir);
        return (await stat(res)).isDirectory() ? getFiles(res) : res;
    }));
    return files.reduce((a, f) => a.concat(f), []);
}

async function generatePlantUML(buildDir, destPath, fileNameNoExt, modelFile) {
    // generate the PlantUML for the ModelFile
    try {
        const generatedPumlFile = `${destPath}/${fileNameNoExt}.puml`;
        const visitor = new CodeGen.PlantUMLVisitor();
        const fileWriter = new CodeGen.FileWriter(buildDir);
        fileWriter.openFile(generatedPumlFile);
        fileWriter.writeLine(0, '@startuml');
        const params = {
            fileWriter: fileWriter
        };
        modelFile.accept(visitor, params);
        fileWriter.writeLine(0, '@enduml');
        fileWriter.closeFile();
        // save the UML
        const modelFilePlantUML = fs.readFileSync(generatedPumlFile, 'utf8');
        const encoded = plantumlEncoder.encode(modelFilePlantUML)
        return `http://www.plantuml.com/plantuml/svg/${encoded}`;
    } catch (err) {
        console.log(err.message);
    }
}

const rootDir = resolve(__dirname, './src');
const buildDir = resolve(__dirname, './build');
let modelFileIndex = [];

// console.log('build: ' + buildDir);
// console.log('rootDir: ' + rootDir);

(async function () {

    // delete build directory
    rimraf.sync(buildDir);

    nunjucks.configure('./views', {
        autoescape: false
    });

    // copy the logo to build directory
    await fs.copy('accord_logo.png', './build/accord_logo.png');

    // validate and copy all the files
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

            try {
                const template = await Template.fromDirectory(templatePath);
                const archive = await template.toArchive();
                const destPath = path.dirname(dest);
                const relative = destPath.slice(buildDir.length);
                const fileNameNoExt = path.parse(fileName).name;

                await fs.ensureDir(destPath);
                const templateId = `${template.getTemplateModel().getFullyQualifiedName()}@${template.getMetadata().getVersion()}.cta`;
                await writeFile(`${destPath}/${templateId}`, archive);
                console.log('Copied: ' + templateId);

                const indexObj = {
                    templateId: templateId,
                    metadata: template.getMetadata()
                };
                if (template.getMetadata().getTemplateType() === 0) {
                    contractIndex.push(indexObj);
                } else {
                    clauseIndex.push(indexObj);
                }

                // generate the template html page
                const converter = new showdown.Converter();
                const readmeHtml = converter.makeHtml(template.getMetadata().getREADME());
                const serverRoot = process.env.SERVER_ROOT;
                const templatePageHtml = `${template.getTemplateModel().getFullyQualifiedName()}@${template.getMetadata().getVersion()}.html`;
                const templateResult = nunjucks.render('template.njk', {
                    serverRoot: serverRoot,
                    filePath: templatePageHtml,
                    template: template,
                    readmeHtml: readmeHtml
                });
                await writeFile(`./build/${templatePageHtml}`, templateResult);
            } catch (err) {
                console.log(`Failed processing ${file} with ${err}`);
            }
        }

        // generate the index html page
        const serverRoot = process.env.SERVER_ROOT;
        const templateResult = nunjucks.render('index.njk', {
            serverRoot: serverRoot,
            contractIndex: contractIndex,
            clauseIndex: clauseIndex
        });
        await writeFile('./build/index.html', templateResult);

        // generate the contract index json page
        const contractResult = nunjucks.render('index-json.njk', {
            serverRoot: serverRoot,
            index: contractIndex
        });
        //console.log(contractResult);
        await writeFile('./build/contract-index.json', contractResult.replace('(', '{').replace(')', '}'));

        // generate the clause index json page
        const clauseResult = nunjucks.render('index-json.njk', {
            serverRoot: serverRoot,
            index: clauseIndex
        });
        await writeFile('./build/clause-index.json', clauseResult.replace('(', '{').replace(')', '}'));
    }
})();