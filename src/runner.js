const path = require('path');
const cosmiconfig = require('cosmiconfig');
const Scraper = require('./scraper');
const CodeBuilder = require('./code-builder');
const ProjectFilesGenerator = require('./project-files-generator');
const { ModelGenerator, ViewGenerator } = require('./code-generator');

class Runner {
    constructor() {
        this.projectFilesGenerator = new ProjectFilesGenerator();
        this.modelGenerator = new ModelGenerator();
        this.viewGenerator = new ViewGenerator();
        this.codeBuilder = new CodeBuilder();
        this.explorer = cosmiconfig('puppetmaster');
    }
    _createView(view, config) {
        const codeAst = this.viewGenerator.createViewComponentFile(view, config);
        this._writeCode(view, codeAst);
    }
    _createModel(model, config) {
        const codeAst = this.modelGenerator.createModelComponentFile(model, config);
        this._writeCode(model, codeAst, 'models');
    }
    _writeCode(spec, codeAst, dir = 'components') {
        const filename = `${spec.viewName || spec.name}.js`;
        const code = this.viewGenerator.formatCode(codeAst);
        this.projectFilesGenerator.generateComponent(filename, code, dir);
    }
    _createProjectFiles(config) {
        const tasks = {
            views: (view) => this._createView(view, config),
            models: (model) => this._createModel(model, config)
        }
        Object.keys(config).forEach((k) => {
            if (tasks[k]) {
                Object.keys(config[k]).forEach((name) => {
                    const item = config[k][name];
                    tasks[k].call(this, item);
                });
            }
        });
    }
    loadConfig() {
        return this.explorer.load();
    }
    async run(options) {
        if (options._[0] === 'new') {
            this.projectFilesGenerator.initNewProject(options.output);
        }
        if (options._[0] === 'generate') {
            const { config } = await this.loadConfig();
            const projectSpec = this.codeBuilder.build(path.resolve(config.playbook));
            this._createProjectFiles(projectSpec);
        }
    }
}
module.exports = Runner;

