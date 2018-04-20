const CodeGenerator = require('./code-generator');
//@ts-check
const recast = require('recast');
const _ = require('lodash');
// @ts-ignore
const b = recast.types.builders;
const ReactAttributesMap = {
    'class': 'className',
    'for': 'htmlFor',
    'tabindex': 'tabIndex'
}

class ReactViewGenerator extends CodeGenerator {
    constructor(nameGenerator) {
        super();
        this.nameGenerator = nameGenerator;
        this.createView = this.createView.bind(this);
    }
    createElement(name, children = [], attrs = []) {
        return b.jsxElement(
            b.jsxOpeningElement(b.jsxIdentifier(name), this.createAttributes(attrs)),
            b.jsxClosingElement(b.jsxIdentifier(name)),
            children
        );
    }
    getStyleAttribute(style) {
        const rules = style.split(';');
        const mappedRules = rules.map((rule) => {
            const [ruleName, ruleVal] = rule.split(':');
            if (ruleName && ruleVal) {
                return b.property(
                    "init",
                    b.identifier(_.camelCase(ruleName)),
                    b.literal(ruleVal)
                );
            }
            return null;
        }).filter((r) => !!r);

        return b.jsxExpressionContainer(
            b.objectExpression(
                mappedRules
            )
        )
    }
    normalizeAttributeName(attr) {
        const attrParts = attr.split('-');
        const normalizedAttr = (attrParts.length > 1 && attrParts[0] !== 'data') ? _.camelCase(attr) : attr;
        return ReactAttributesMap[attr] || normalizedAttr;
    }
    createAttributes(attrs = []) {
        return Object.keys(attrs).map((attr) => {
            const valueNode = typeof attrs[attr] === 'object' ? 
                                     attrs[attr] : b.literal(attrs[attr]);
            let attrValue = b.jsxExpressionContainer(valueNode);
            if (attr === 'style') {
                attrValue = this.getStyleAttribute(attrs[attr]);
            }

            return b.jsxAttribute(
                b.jsxIdentifier(this.normalizeAttributeName(attr)),
                attrValue
            );
        });
    }
    renderAsText(p) {
        const children = [
            b.jsxExpressionContainer(
                this.getPropAccess(p)
            )
        ];
        return this.createElement('div', children);
    }
    renderAsReadonlyObject(p) {
        const childName = p.viewName || p.name;
        return this.createElement(childName, [], {
            [p.name]: this.getPropAccess(p)
        });
    }
    renderAsList(p) {
        const callbackFn = b.arrowFunctionExpression(
            [b.identifier(p.elementModel.name)],
            this.createView(p.elementModel)
        );
        const itemMapping = b.callExpression(
            b.memberExpression(
                this.getPropAccess(p),
                b.identifier('map')
            ),
            [callbackFn]
        );
        return b.jsxExpressionContainer(itemMapping);
    }
    getPropAccess(p) {
        const node = p.parentPropName ? b.memberExpression(
            b.identifier('props'),
            b.identifier(p.parentPropName)
        ) : b.identifier('props');

        return b.memberExpression(
            node,
            b.identifier(p.name)
        );
    }
    createComponent(el) {
        const componentBodyAst = el.props.map(this.createView);

        return b.arrowFunctionExpression(
            [b.identifier('props')],
            b.blockStatement(
                [
                    b.returnStatement(
                        this.createElement('div', componentBodyAst)
                    )
                ]
            )
        )
    }
    createView(p) {
        const viewPresenters = {
            'text': this.renderAsText,
            'list': this.renderAsList,
            'object': this.renderAsReadonlyObject
        }
        if (viewPresenters[p.presenter]) {
            return viewPresenters[p.presenter].call(this, p);
        } else {
            console.log('No presenter found for:', JSON.stringify(p));
        }
    }
    _makeObservable(reactComponent) {
        return b.callExpression(
            b.identifier('observer'),
            [reactComponent]
        )
    }
    createViewComponentFile(el, config) {
        const componentName = el.viewName || el.name;
        const elImports = el.imports.slice(0);
        const imports = this.createImports(elImports);
        const reactComponent = this.createComponent(el, config);
        const reactImport = this.createDefaultExport('React', 'react');
        const allImports = [reactImport].concat(imports);
        const exportCompDeclaration = b.exportNamedDeclaration(
            b.variableDeclaration('const', [
                b.variableDeclarator(
                    b.identifier(componentName),
                    this._makeObservable(reactComponent)
                )
            ])
        );
        const programBody = allImports.concat([exportCompDeclaration]);
        return b.program(programBody);
    }
}


module.exports = ReactViewGenerator;