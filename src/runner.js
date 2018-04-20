const path = require('path');
const cosmiconfig = require('cosmiconfig');
const Scraper = require('./scraper');
const CodeBuilder = require('./builders/code-builder');
const ProjectFilesGenerator = require('./project-files-generator');
const PlaybookParser = require('./playbook-parser');
const { GeneratorsFactory, CodeFormatter } = require('./generators');

class Runner {
    constructor() {
        this.projectFilesGenerator = new ProjectFilesGenerator();
        this.generatorsFactory = new GeneratorsFactory(this.projectFilesGenerator);
        this.playbookParser = new PlaybookParser();
        this.codeBuilder = new CodeBuilder();
        this.formatter = new CodeFormatter();
        this.explorer = cosmiconfig('puppetmaster');
    }
    createView(view, config) {
        const viewGenerator = this.generatorsFactory.getViewGenerator();
        const codeAst = viewGenerator.createViewComponentFile(view, config);
        this.writeCode(view, codeAst);
    }
    createModel(model, config) {
        const modelGenerator = this.generatorsFactory.getModelGenerator();
        const codeAst = modelGenerator.createModelComponentFile(model, config);
        this.writeCode(model, codeAst, 'models');
    }
    writeCode(spec, codeAst, dir = 'components') {
        const filename = `${spec.viewName || spec.name}.js`;
        const code = this.formatter.format(codeAst);
        this.projectFilesGenerator.generateComponent(filename, code, dir);
    }
    executeTasks(config, tasks) {
        Object.keys(config).forEach((k) => {
            if (tasks[k]) {
                const models = config[k];
                models.forEach((model) => {
                    tasks[k].call(this, model);
                });
            }
        });
    }
    createProjectFiles(config) {
        const tasks = {
            views: (view) => this.createView(view, config),
            clientEntities: (model) => this.createModel(model, config)
        }
        this.executeTasks(config, tasks);
    }
    async loadConfig() {
        const { config } = await this.explorer.load();
        const finalConfig = Object.assign({}, {
            playbook: './playbook.ts',
            frameworks: {
                ui: 'react',
                state: 'mobx'
            }
        }, config);

        return finalConfig;
    }
    async run(options) {
        if (options._[0] === 'new') {
            this.projectFilesGenerator.initNewProject(options.output);
        }
        if (options._[0] === 'generate') {
            const config = await this.loadConfig();
            const playbookPath = path.resolve(config.playbook);
            this.generatorsFactory.setConfig(config);
            const modelRegistry = this.playbookParser.parse(playbookPath);
            this.codeBuilder.setModelRegistry(modelRegistry);
            const projectSpec = this.codeBuilder.build();
            this.createProjectFiles(projectSpec);
        }
    }
}
module.exports = Runner;

