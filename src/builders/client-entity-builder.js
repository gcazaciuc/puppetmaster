const Builder = require('./builder');

class ClientEntityBuilder extends Builder {
    constructor(modelRegistry, nameGenerator) {
        super(modelRegistry, nameGenerator);
        this.type = 'Entity';
    }
    build() {
        const models = this.getBuilderModels();
        return models.map((m) => {
            return Object.assign({}, this.modelRegistry[m], {
                imports: []
            });
        });
    }
}

module.exports = ClientEntityBuilder;