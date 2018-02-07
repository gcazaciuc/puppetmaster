const recast = require('recast');
const parser = require('flow-parser');
const prettier = require("prettier");
const _ = require('lodash');
const b = recast.types.builders;
const ReactAttributesMap = {
    'class': 'className',
    'for': 'htmlFor'
}
const printOptions = {
    tabWidth: 4,
    singleQuote: true,
    jsxBracketSameLine: true
};

class CodeGenerator {
    createCodeFromVDOM(el, parentEl) {
        if (typeof el === 'string') {
            return b.jsxExpressionContainer(b.literal(el));
        }
        const children = el.children.map((child) => {
            const customComponentParent = el.custom ? el : parentEl;
            return this.createCodeFromVDOM(child, customComponentParent);
        });
        el.markup = children;
        if (!el.custom) {
            const styledName = this.getStyledComponentName(el, parentEl.styledCompNames);
            const styled = this.getStyledElement(el, styledName);
            parentEl.styled.push(styled);
            parentEl.styledCompNames.push(styledName);
            return this.createElement(styledName, children, el.props);
        }
        if (parentEl && parentEl !== el) {
            parentEl.imports.push(el);
        }
        return this.createElement(el.componentName);
    }
    getStyledComponentName(el, existingStyledCompNames) {
        const styledName = _.upperFirst(_.camelCase(el.componentName));
        const existingName = existingStyledCompNames.find((c) => c === styledName);

        return existingName ? `${styledName}${existingStyledCompNames.length}` : styledName;
    }
    getStyledElement(el, styledName) {
        const styles = _.uniq(_.flatten(el.appliedStyles.map((st) => st.split(';')))).join(';');
        const styled = b.variableDeclaration(
            'const',
            [
                b.variableDeclarator(
                    b.identifier(styledName),
                    b.taggedTemplateExpression(
                        b.memberExpression(b.identifier('styled'), b.identifier(el.tag)),
                        b.templateLiteral(
                            [b.templateElement({
                                raw: styles,
                                cooked: styles
                            }, true)], []
                        )
                    )
                )
            ]
        );
        return styled;
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
    createAttributes(attrs = []) {
        delete attrs['data-nodeid'];
        return Object.keys(attrs).map((attr) => {
            let attrValue = b.jsxExpressionContainer(b.literal(attrs[attr]));
            if (attr === 'style') {
                attrValue = this.getStyleAttribute(attrs[attr]);
            }
            return b.jsxAttribute(
                b.jsxIdentifier(ReactAttributesMap[attr] || attr),
                attrValue
            );
        });
    }
    createSFC(el) {
        const componentBodyAst = el.markup;
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
    createReactComponentFile(el) {
        const componentName = el.componentName;
        const imports = _.uniqBy(el.imports, (e) => e.componentName).map((imp) => {
            return this.createNamedImport(imp.componentName, imp.componentName);
        });
        const reactComponent = this.createSFC(el);
        const reactImport = this.createDefaultExport('React', 'react');
        const styledCompsImport = this.createDefaultExport('styled', 'styled-components');
        const allImports = [reactImport, styledCompsImport].concat(imports);
        const importsAndFileBody = allImports.concat(el.styled);
        const exportCompDeclaration = b.exportNamedDeclaration(
            b.variableDeclaration('const', [
                b.variableDeclarator(
                    b.identifier(componentName),
                    reactComponent
                )
            ])
        );
        const programBody = importsAndFileBody.concat([exportCompDeclaration]);
        return b.program(programBody);
    }
    createNamedImport(name, source) {
        return b.importDeclaration(
            [
                b.importSpecifier(
                    b.identifier(name),
                    b.identifier(name)
                )
            ],
            b.literal(`./${source}`)
        );
    }
    createDefaultExport(name, source) {
        return b.importDeclaration(
            [
                b.importDefaultSpecifier(b.identifier(name))
            ],
            b.literal(source)
        )
    }
    formatCode(codeAst) {
        return prettier.format(
            recast.print(codeAst).code
            ,printOptions
        );
    }
}

module.exports = CodeGenerator;