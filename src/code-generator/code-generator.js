//@ts-check
const recast = require('recast');
const parser = require('flow-parser');
const prettier = require("prettier");
const _ = require('lodash');
// @ts-ignore
const b = recast.types.builders;
const ReactAttributesMap = {
    'class': 'className',
    'for': 'htmlFor',
    'tabindex': 'tabIndex'
}
const printOptions = {
    tabWidth: 4,
    singleQuote: true,
    jsxBracketSameLine: true
};

class CodeGenerator {
    createImports(elImports) {
        return _.uniqBy(elImports || [], (e) => e.source).map((imp) => {
            return this.createNamedImport(imp);
        });
    }
    
    createNamedImport(importSpec) {
        const importSpecs = [].concat(importSpec);
        const source = importSpecs[0].source;

        return b.importDeclaration(
            importSpecs.map((imp) =>
                b.importSpecifier(
                    b.identifier(imp.name),
                    b.identifier(imp.name)
                )
            ),  
            b.literal(source)
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
            // @ts-ignore
            recast.print(codeAst).code
            ,printOptions
        );
    }
}

module.exports = CodeGenerator;