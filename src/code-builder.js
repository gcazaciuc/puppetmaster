//@ts-check
const recast = require('recast');
const parser = require('flow-parser');
const _ = require('lodash');
const types = recast.types;
const b = recast.types.b;
const fs = require('fs');

class CodeBuilder {
    constructor() {
        this._config = {};
        this._createChildView = this._createChildView.bind(this);
    }
    _parseInterface(path) {
        const { node } = path;
        const modelName = node.id.name;
        this._config[modelName] = this._config[modelName] || {};
        Object.assign(this._config[modelName], {
            name: modelName, 
            props: this._parseInterfaceMembers(node.body.properties),
            modifiers: this._parseExtends(node),
            imports: []
        });
    }
    _parseExtends(node) {
        return node.extends.map((e) => e.id.name);
    }
    _parseValue(val) {
        switch(val.type) {
            case 'GenericTypeAnnotation':
                return { type: val.id.name, standard: false, default: null };
            case 'StringTypeAnnotation':
                return { type: 'string', standard: true, default: '' };
            case 'StringLiteralTypeAnnotation':
                return { type: 'string', standard: true, default: val.value };
            case 'NumberLiteralTypeAnnotation':
                return { type: 'number', standard: true, default: val.value };
            case 'NumberTypeAnnotation':
                return { type: 'number', standard: true, default: 0 };
            case 'BooleanTypeAnnotation':
                return { type: 'bool', standard: true, default: false };
        }
        return {};
    }
    _parseInterfaceMembers(props) {
        return props.map((m) => {
           return Object.assign(
               { name: m.key.name }, this._parseValue(m.value)
           );
        });
    }
    _buildConfig(configPath) {
        const source = String(fs.readFileSync(configPath));
        const ast = recast.parse(source, {
            parser
        });
        const that = this;
        const visitors = {
            visitInterfaceDeclaration: function (path) {
                that._parseInterface(path);
                this.traverse(path);
            }
        };
        types.visit(ast, visitors);
        return this._config;
    }
    _getModelsOfType(type) {
        return Object.keys(this._config).filter((name) => {
            return name.endsWith(type);
        }).map((name) => this._config[name]);
    }
    _toObject(modelsArr) {
        return modelsArr.reduce((acc, v) => {
            acc[v.name] = v;
            return acc;
        }, {});
    }
    _processViewModels(viewModels) {
        const views = {};

       viewModels.forEach((view) => {
            const viewName = view.name;
            const vm = Object.assign({}, view, { name: viewName, viewName });
            vm.tag = 'div';
            vm.imports = vm.imports || [];
            vm.imports.push({ name: 'observer', source: 'mobx-react' });
            views[viewName] = vm;
            vm.props = vm.props.map((p) => {
                if (!p.standard) {
                    const childVM = this._createChildView(p);
                    views[childVM.viewName] = childVM;
                    vm.imports.push({ name: childVM.viewName, source: `./${childVM.viewName}` });
                    return childVM;
                }
                return p;
            });
        });
        return views;
    }
    _createChildView(p) {
        const camelCasedName = _.upperFirst(p.name);
        const childName = camelCasedName.endsWith('View') ? camelCasedName : `${camelCasedName}View`;
        const childVM = Object.assign({ imports: [] }, p, {
            name: p.name,
            viewName: childName,
            tag: 'div',
            props: this._config[p.type].props.map((cp) => Object.assign({}, cp, { parent: p.name }))
        });
        this._processViewModels([childVM]);
        return childVM;
    }
    _getViews() {
        const viewModels = this._getModelsOfType('View');
        return this._processViewModels(viewModels);
    }
    _getModels() {
        return this._toObject(this._getModelsOfType('Entity'));
    }
    _getRoutes() {
        return this._toObject(this._getModelsOfType('Route'));
    }
    getConfig() {
        return this._config;
    }
    build(configPath) {
        this._buildConfig(configPath); 
        return {
            views: this._getViews(),
            models: this._getModels(),
            routes: this._getRoutes(),
            config: this._config
        }
    }
}
module.exports = CodeBuilder;