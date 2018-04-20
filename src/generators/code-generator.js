//@ts-check
const recast = require('recast');
const parser = require('flow-parser');
const _ = require('lodash');
// @ts-ignore
const b = recast.types.builders;

class CodeGenerator {
    constructor() {
        
    }
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
}

module.exports = CodeGenerator;