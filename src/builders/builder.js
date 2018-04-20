class Builder {
    constructor(modelRegistry, nameGenerator) {
        this.type = '';
        this.modelRegistry = modelRegistry;
        this.nameGenerator = nameGenerator;
        this.generatedModels = [];
    }
    createModel() {
        return {};
    }
    build() {
        const models = this.getBuilderModels();
        models.forEach((m) => {
            return Object.assign({}, this.modelRegistry[m], this.createModel(this.modelRegistry[m]));
        });
        return this.generatedModels;
    }
    getBuilderModels() {
        return Object.keys(this.modelRegistry)
              .filter((m) => m.endsWith(this.type));
    }
}

module.exports = Builder;