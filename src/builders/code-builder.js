//@ts-check
const recast = require('recast');
const parser = require('flow-parser');
const ViewBuilder = require('./view-builder');
const RouteBuilder = require('./route-builder');
const ClientEntityBuilder = require('./client-entity-builder');
const NameGenerator = require('../name-generator');
const types = recast.types;
const b = recast.types.b;
const fs = require('fs');

class CodeBuilder {
    constructor(nameGenerator) {
        this.nameGenerator = new NameGenerator();
    }
    setModelRegistry(modelRegistry) {
        this.modelRegistry = modelRegistry;
        this.viewBuilder = new ViewBuilder(modelRegistry, this.nameGenerator);
        this.clientEntityBuilder = new ClientEntityBuilder(modelRegistry, this.nameGenerator);
        this.routeBuilder = new RouteBuilder(modelRegistry, this.nameGenerator);
    }
    build() {
        return {
            views: this.viewBuilder.build(),
            clientEntities: this.clientEntityBuilder.build(),
            routes: this.routeBuilder.build()
        }
    }
}
module.exports = CodeBuilder;