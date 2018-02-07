const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

class ProjectFilesGenerator {
    constructor() {
        this.templatesDir = path.resolve('templates');
        this.outputDir = path.resolve('output');
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
    generate() {
        this.generateIndexHtml();
        this.generateIndexJS();
        this.generatePackageJSON();
        this.generateWebpackConfig();
        this.generateBabelRc();
    }
    generateComponent(filename, code) {
        mkdirp.sync(path.resolve('output', 'components'));
        fs.writeFileSync(path.resolve('output', 'components', filename), code);
    }
    copyFile(source, dest) {
        fs.createReadStream(source).pipe(fs.createWriteStream(dest));
    }
}
module.exports = ProjectFilesGenerator;