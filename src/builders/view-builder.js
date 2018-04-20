const Builder = require('./builder');

class ViewBuilder extends Builder {
    constructor(modelRegistry, nameGenerator) {
        super(modelRegistry, nameGenerator);
        this.type = 'View';
        this.modelBuilders = {
            'string': this.createPrimitiveModel,
            'number': this.createPrimitiveModel,
            'bool': this.createPrimitiveModel,
            'array': this.createArrayModel,
            'interface': this.createInterfaceModel
        };
    }
    createPrimitiveModel(parsedModel) {
        return Object.assign({}, parsedModel, {
            imports: [],
            presenter: 'text'
        });
    }
    createArrayModel(parsedModel, parent) {
        // Create a view holding the list
        const objectViewModel = this.createInterfaceModel(parsedModel, parent);
        // Create a model for the array elements
        const elementModel = this.modelRegistry[parsedModel.elementTypeClass];
        const elementViewModel = this.createModel(elementModel);
        elementViewModel.name = this.nameGenerator.viewPropName(elementModel);
        elementViewModel.viewName = this.nameGenerator.listItemViewName(elementModel);
        // Create a child of the list view that iterates over the elements and displays them
        // using an elementViewModel
        const listViewModel = this.createViewModel(parsedModel);
        listViewModel.presenter = 'list';
        listViewModel.elementModel = elementViewModel;
        listViewModel.name = parsedModel.name;
        
        objectViewModel.imports.push({ 
            name: elementViewModel.viewName, 
            source: `./${elementViewModel.viewName}` 
        });
        objectViewModel.props.push(listViewModel);
        return objectViewModel;
    }
    createInterfaceModel(parsedModel, parent) {
        const vm = this.createViewModel(parsedModel, parent);
        vm.presenter = 'object';
        const modelProps = this.modelRegistry[parsedModel.typeClass].props;
        vm.props = vm.props || [];
        vm.props = modelProps.map((p) => {
            let m = this.createModel(p, vm);
            if (!vm.name.endsWith('View')) {
                m = Object.assign({}, m, { parentPropName: vm.name });
            }
            return m;
        });
        this.generatedModels.push(vm);
        return vm;
    }
    createViewModel(parsedModel, parent) {
        const viewName = this.nameGenerator.viewNameFromProp(parsedModel);
        const vm = Object.assign({}, parsedModel, { viewName });
        vm.imports = vm.imports || [];
        vm.imports.push({ name: 'observer', source: 'mobx-react' });
        if (parent) {
            parent.imports.push({ name: vm.viewName, source: `./${vm.viewName}` });
        }
        return vm;
    }

    createModel(parsedModel, parent = null) {
        if (this.modelBuilders[parsedModel.type]) {
            const generatedModel = this.modelBuilders[parsedModel.type].call(this, parsedModel, parent);
            return generatedModel;
        } else {
            console.log('No model builder found for:', JSON.stringify(parsedModel));
        }
    }
}

module.exports = ViewBuilder;