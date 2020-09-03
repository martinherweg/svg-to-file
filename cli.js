#!/usr/bin/env node

const args = require('args');
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const SVGO = require('svgo');
const svgoConfig = require('./svgo.config');
const svgo = new SVGO(svgoConfig);
const stringcase = require('stringcase');

args.option('srcFolder', 'The folder the svgs should be read from').option('outputFile', 'The file the SVG gets written to');

const flags = args.parse(process.argv);

function getFileNames(dir) {
  const svgFiles = glob.sync('**/*.svg', {
    cwd: dir,
    absolute: true,
  });

  return svgFiles;
}

function readSvgData(file) {
  const fileContent = fs.readFileSync(file, {
    encoding: 'UTF-8'
  });
  return fileContent;
}

async function formatSvg(svgCode) {
  const optimizedCode = await svgo.optimize(svgCode);
  return optimizedCode;
}

function createFileData(file) {
  const baseName = stringcase.spinalcase(path.basename(file, '.svg'));

  return {
    baseName,
  }
};

function writeDataToJsFile(object) {
  const stringToWrite = `module.exports = ${JSON.stringify(object)}`;
  fs.writeFileSync(flags.outputFile, stringToWrite);
}

async function run() {
  const dir = path.resolve(process.cwd(), flags.srcFolder);
  const svgFiles = getFileNames(dir);
  const svgIconObject = {};

  for (let file of svgFiles) {
    const svgData = readSvgData(file);
    const fileData = createFileData(file);
    const { data: optimizedCode } = await formatSvg(svgData);
    svgIconObject[fileData.baseName] = optimizedCode;
  }

  writeDataToJsFile(svgIconObject);
}

run();

