//@ts-check
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const hashIt = require('hash-it').default;

class ProjectFilesGenerator {
    constructor() {
        this.templatesDir = path.resolve('templates');
        this.outputDir = process.cwd();
    }
    configure(options) {
        this.outputDir = path.resolve(options.output);
    }
    initNewProject(dir) {
        const projectDir = path.resolve(process.cwd(), dir);
        this.outputDir = projectDir;
        mkdirp.sync(path.resolve(projectDir));
        mkdirp.sync(path.resolve(projectDir, 'src', 'components'));
        mkdirp.sync(path.resolve(projectDir, 'src', 'models'));

        this.generate();
    }
    generateIndexHtml() {
        this.copyFile(
            path.resolve(this.templatesDir, 'index.tmpl'),
            path.resolve(this.outputDir, 'index.html')
        );
    }
    generateIndexJS() {
        this.copyFile(
            path.resolve(this.templatesDir, 'index.js.tmpl'),
            path.resolve(this.outputDir, 'index.js')
        );
    }
    generatePackageJSON() {
        this.copyFile(
            path.resolve(this.templatesDir, 'package.json.tmpl'),
            path.resolve(this.outputDir, 'package.json')
        );
    }
    generateWebpackConfig() {
        this.copyFile(
            path.resolve(this.templatesDir, 'webpack.config.js.tmpl'),
            path.resolve(this.outputDir, 'webpack.config.js')
        );
    }
    generateBabelRc() {
        this.copyFile(
            path.resolve(this.templatesDir, 'babelrc.tmpl'),
            path.resolve(this.outputDir, '.babelrc')
        );
    }
    generateConfigFile() {
        this.copyFile(
            path.resolve(this.templatesDir, 'puppetmaster.config.js.tmpl'),
            path.resolve(this.outputDir, 'puppetmaster.config.js')
        );
    }
    generatePlaybookFile() {
        this.copyFile(
            path.resolve(this.templatesDir, 'playbook.ts.tmpl'),
            path.resolve(this.outputDir, 'playbook.ts')
        );
    }
    generate() {
        this.generateIndexHtml();
        this.generateIndexJS();
        this.generatePackageJSON();
        this.generateWebpackConfig();
        this.generateBabelRc();
        this.generateConfigFile();
        this.generatePlaybookFile();
    }
    generateComponent(filename, code, dir = 'components') {
        mkdirp.sync(path.resolve(this.outputDir, 'src', dir));
        fs.writeFileSync(path.resolve(this.outputDir, 'src', dir, filename), code);
    }
    writeImage(img, url) {
        let imageName = url.split('/').pop();
        if (imageName.slice(0, 5) === 'data:') {
            return;
        }
        if (imageName.length > 50) {
            imageName = hashIt(imageName)+'.png';
        }
        mkdirp.sync(path.resolve(this.outputDir, 'images'));
        fs.writeFileSync(path.resolve(this.outputDir, 'images', imageName), img);
    }
    cleanup() {
        // rimraf.sync(path.resolve('output', 'components'));
        // rimraf.sync(path.resolve('output', 'images'));
    }
    copyFile(source, dest) {
        fs.createReadStream(source).pipe(fs.createWriteStream(dest));
    }
}
module.exports = ProjectFilesGenerator;