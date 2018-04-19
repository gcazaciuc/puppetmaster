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

class ViewGenerator extends CodeGenerator {
    createMarkup(el, parentEl) {
        if (typeof el === 'string') {
            return b.jsxExpressionContainer(b.literal(el));
        }
        const children = el.props.map((child) => {
            const customComponentParent = el.custom ? el : parentEl;
            return this.createMarkup(child, customComponentParent);
        });
        el.markup = children;
        if (!el.custom) {
            let styledName = el.componentName;
            return this.createElement(styledName, children, el.props);
        }
        if (parentEl && parentEl !== el) {
            parentEl.imports.push(el);
        }
        return this.createElement(el.componentName);
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
    createStandardPropDisplay(p) {
        const node = p.parent ? b.memberExpression(
            b.identifier('props'),
            b.identifier(p.parent)
        ) : b.identifier('props');

        const children = [
            b.jsxExpressionContainer(
                b.memberExpression(
                    node,
                    b.identifier(p.name)
                )
            )
        ];
        return this.createElement('div', children);
    }
    createCustomPropDisplay(p) {
        const childName = p.viewName || p.name;
        const node = p.parent ? b.memberExpression(
            b.identifier('props'),
            b.identifier(p.parent)
        ) : b.identifier('props');
        return this.createElement(childName, [], {
            [p.name]: b.memberExpression(
                node,
                b.identifier(p.name)
            )
        });
    }
    createComponent(el) {
        const componentBodyAst = el.props.map((p) => {
            if (p.standard) {
                return this.createStandardPropDisplay(p);
            }
            return this.createCustomPropDisplay(p);
        });

        return b.arrowFunctionExpression(
            [b.identifier('props')],
            b.blockStatement(
                [
                    b.returnStatement(
                        this.createElement(el.tag, componentBodyAst)
                    )
                ]
            )
        )
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


module.exports = ViewGenerator;