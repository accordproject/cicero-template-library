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
        const params = {fileWriter : fileWriter};
        modelFile.accept(visitor, params);
        fileWriter.writeLine(0, '@enduml');
        fileWriter.closeFile();
        // save the UML
        const modelFilePlantUML = fs.readFileSync(generatedPumlFile, 'utf8');
        const encoded = plantumlEncoder.encode(modelFilePlantUML)
        return `http://www.plantuml.com/plantuml/svg/${encoded}`;        
    }
    catch(err) {
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

    nunjucks.configure('./views', { autoescape: true });
    
    // copy the logo to build directory
    await fs.copy('accord_logo.png', './build/accord_logo.png');

    // validate and copy all the files
    const files = await getFiles(rootDir);
    const index = [];

    for( const file of files ) {
        const fileName = path.basename(file);
        const filePath = path.dirname(fileName);

        if(fileName === 'package.json' && file.indexOf('/node_modules/') === -1) {    
            // read the parent directory as a template
            const templatePath = path.dirname(file);
            const dest = templatePath.replace('/src/', '/build/');

            try {
                const template = await Template.fromDirectory(templatePath);
                const archive = await template.toArchive();
                const destPath = path.dirname(dest);
                await fs.ensureDir(destPath);
                const templateId = `${template.getTemplateModel().getFullyQualifiedName()}@${template.getMetadata().getVersion()}.cta`;
                await writeFile( `${destPath}/templateId`, archive);
                console.log('Copied: ' + templateId );
                index.push({id: templateId});
            }
            catch(err) {
                console.log(`Failed processing ${file} with ${err}`);
            }
        }

        // write the index
        await writeFile( './build/index.json', JSON.stringify(index));

        // generate the index html page
        const serverRoot = process.env.SERVER_ROOT;
        const templateResult = nunjucks.render('index.njk', { serverRoot: serverRoot, templateIndex: index });
        await writeFile( './build/index.html', templateResult);

        // const modelText = fs.readFileSync(file, 'utf8');
        // const modelManager = new ModelManager();
        // const modelFile  = new ModelFile(modelManager, modelText, file);     
        // let modelFilePlantUML = '';
        // // passed validation, so copy to build dir
        // const dest = file.replace('/src/', '/build/');
        // const destPath = path.dirname(dest);
        // const relative = destPath.slice(buildDir.length);
        // // console.log('dest: ' + dest);
        // // console.log('destPath: ' + destPath);
        // // console.log('relative: ' + relative);
        
        // const fileName = path.basename(file);
        // const fileNameNoExt = path.parse(fileName).name;

        // await fs.ensureDir(destPath);
        // let umlURL = '';
        // try {
        //     modelManager.addModelFile(modelFile, modelFile.getName(), true);

        //     // use the FORCE_PUBLISH flag to disable download of
        //     // external models and model validation
        //     if(!process.env.FORCE_PUBLISH) {
        //         modelManager.updateExternalModels();
        //     }

        //     umlURL = await generatePlantUML(buildDir, destPath, fileNameNoExt, modelFile);
        //     await generateTypescript(buildDir, destPath, fileNameNoExt, modelFile);
        //     await generateJsonSchema(buildDir, destPath, fileNameNoExt, modelFile);
        //     await generateJava(buildDir, destPath, fileNameNoExt, modelFile);
        //     await generateGo(buildDir, destPath, fileNameNoExt, modelFile);
            
        //     // copy the CTO file to the build dir
        //     await fs.copy(file, dest);
        //     console.log('Copied ' + file);

        //     // generate the html page for the model
        //     const generatedHtmlFile = `${relative}/${fileNameNoExt}.html`;
        //     const serverRoot = process.env.SERVER_ROOT;
        //     const templateResult = nunjucks.render('model.njk', { serverRoot: serverRoot, modelFile: modelFile, filePath: `${relative}/${fileNameNoExt}`, umlURL: umlURL });
        //     fs.writeFile( `./build/${generatedHtmlFile}`, templateResult, function (err) {
        //         if (err) {
        //             return console.log(err);
        //         }
        //     modelFileIndex.push( {htmlFile: generatedHtmlFile, modelFile: modelFile});
    }

    // });
})();