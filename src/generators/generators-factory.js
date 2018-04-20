const MobxModelGenerator = require('./mobx-model-generator');
const ReactViewGenerator = require('./react-view-generator');

const NameGenerator = require('../name-generator');
class GeneratorsFactory {
    constructor(projectFilesGenerator) {
        const nameGenerator = new NameGenerator();
        this.projectFilesGenerator = projectFilesGenerator;
        this.viewGenerators = {
             'react': new ReactViewGenerator(nameGenerator)
        };
        this.modelGenerators = {
             'mobx': new MobxModelGenerator(nameGenerator)
        };
        this.entityGenerators = {};
        this.routeGenerators = {};
        this.config = {};
    }
    setConfig(config) {
        this.config = config;
    }
    getModelGenerator() {
        const stateFramework = this.config.frameworks.state;
        return this.modelGenerators[stateFramework];
    }
    getViewGenerator() {
        const uiFramework = this.config.frameworks.ui;
        return this.viewGenerators[uiFramework];
    }
    registerViewGenerator(name, generator) {
        this.viewGenerators[name] = generator;
    }
    registerModelGenerator(name, generator) {
        this.modelGenerators[name] = generator;
    }
    registerEntityGenerator(name, generator) {
        this.entityGenerators[name] = generator;
    }
    registerRouteGenerator(name, generator) {
        this.routeGenerators[name] = generator;
    }
}

module.exports = GeneratorsFactory;