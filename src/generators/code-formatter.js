//@ts-check
const recast = require('recast');
const prettier = require("prettier");

class CodeFormatter {
    constructor() {
        this.printOptions = {
            tabWidth: 4,
            singleQuote: true,
            jsxBracketSameLine: true
        };
    }
    format(codeAst) {
        return prettier.format(
            // @ts-ignore
            recast.print(codeAst).code
            , this.printOptions
        );
    }
}

module.exports = CodeFormatter;