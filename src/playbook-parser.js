//@ts-check
const recast = require('recast');
const parser = require('flow-parser');
const types = recast.types;
const fs = require('fs');

class PlaybookParser {
    constructor() {
        const that = this;
        this.modelRegistry = {
            'Array': { props: [] }
        };
        this.standardNodes = { 
            'string': { type: 'string', standard: true, default: '' },
            'number': { type: 'number', standard: true, default: 0 },
            'bool': { type: 'bool', standard: true, default: false }
        };
        this.visitors = {
            visitInterfaceDeclaration: function (path) {
                that.parseInterface(path);
                this.traverse(path);
            }
        };
    }
    parse(playbookPath) {
        const source = String(fs.readFileSync(playbookPath));
        const ast = recast.parse(source, {
            parser
        });
        types.visit(ast, this.visitors);
        return this.modelRegistry;
    }
    parseInterface(path) {
        const { node } = path;
        const modelName = node.id.name;
        this.register(modelName, {
            name: modelName,
            typeClass: modelName,
            type: 'interface',
            props: this.parseInterfaceMembers(node.body.properties),
            modifiers: this.parseExtends(node),
        });
    }
    register(modelName, modelSpec = {}) {
        this.modelRegistry[modelName] = this.modelRegistry[modelName] || {};
        Object.assign(this.modelRegistry[modelName], modelSpec);
    }
    parseExtends(node) {
        return node.extends.map((e) => e.id.name);
    }
    parseValue(val) {
        switch (val.type) {
            case 'GenericTypeAnnotation':
                return { type: 'interface', 'typeClass': val.id.name, standard: false, default: null };
            case 'StringTypeAnnotation':
                return this.standardNodes['string'];
            case 'StringLiteralTypeAnnotation':
                return { type: 'string', standard: true, default: val.value };
            case 'NumberLiteralTypeAnnotation':
                return { type: 'number', standard: true, default: val.value };
            case 'NumberTypeAnnotation':
                return this.standardNodes['number'];
            case 'BooleanTypeAnnotation':
                return this.standardNodes['bool'];
            case 'ArrayTypeAnnotation':
                const { typeClass: elementType } = this.parseValue(val.elementType);
                return {
                    type: 'array', standard: false, default: null, 
                    typeClass: 'Array', elementTypeClass: elementType
                };
        }
        return {};
    }
    parseInterfaceMembers(props) {
        return props.map((m) => {
            return Object.assign(
                { name: m.key.name }, this.parseValue(m.value)
            );
        });
    }
}

module.exports = PlaybookParser;