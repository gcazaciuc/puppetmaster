const CodeGenerator = require('./code-generator');
//@ts-check
const recast = require('recast');
// @ts-ignore
const b = recast.types.builders;

class ModelGenerator extends CodeGenerator {
    createModelComponentFile(el) {
        const componentName = el.name;
        const elImports = el.imports.slice(0);
        elImports.unshift(
            { source: 'mobx', name: 'observable' },
            { source: 'mobx', name: 'decorate' }
        );
        const imports = this.createImports(elImports);
        const model = this.createModel(el);
        const exportCompDeclaration = b.exportNamedDeclaration(
            b.classDeclaration(
                b.identifier(componentName),
                model
            )
        );
        const decorateDeclaration = this.createModelDecorators(el);
        const programBody = imports.concat([exportCompDeclaration, decorateDeclaration]);
        return b.program(programBody);
    }
    _getModelFieldInitValue(prop) {
        if (prop.standard) {
            return b.literal(prop.default);
        }
        return b.newExpression(
            b.identifier(prop.type),
            []
        );
    }
    createModel(el) {
        return b.classBody(
            el.props.map((prop) => {
                return b.classProperty(
                    b.identifier(prop.name),
                    this._getModelFieldInitValue(prop),
                    null,
                    false
                )
            })
        );
    }
    createModelDecorators(el) {
        return b.expressionStatement(
            b.callExpression(
                b.identifier('decorate'),
                [
                    b.identifier(el.name),
                    b.objectExpression(
                        el.props.map((p) => b.property(
                            'init',
                            b.identifier(p.name),
                            b.identifier('observable')
                        ))
                    )
                ]
            )
        )
    }
}

module.exports = ModelGenerator;