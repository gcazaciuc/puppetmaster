
// #!/usr/bin / env node
const argv = require('minimist')(process.argv.slice(2));
const Scraper = require('../src/scraper');
const CompoundComponentDetector = require('../src/compound-component-detector');
const ProjectFilesGenerator = require('../src/project-files-generator');
const ReactComponentGenerator = require('../src/react-component-generator');
const CodeGenerator = require('../src/code-generator');
const WordPOS = require('wordpos');

const wordpos = new WordPOS();
const compoundDetector = new CompoundComponentDetector(wordpos);
const projectFilesGenerator = new ProjectFilesGenerator();
const codeGenerator = new CodeGenerator();
const componentGenerator = new ReactComponentGenerator(projectFilesGenerator, compoundDetector, codeGenerator);
const scraper = new Scraper(projectFilesGenerator, componentGenerator);

scraper.scrape('https://twitter.com/?lang=en');