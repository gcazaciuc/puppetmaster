const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

class ReactComponentGenerator {
    constructor(projectFilesGenerator, compoundComponentDetector, codeGenerator) {
        this.compoundComponentDetector = compoundComponentDetector;
        this.projectFilesGenerator = projectFilesGenerator;
        this.codeGenerator = codeGenerator;
        this.client = null;
    }
    setClient(client) {
        this.client = client;
    }
    async getAppliedStyles(nodeId) {
        const elStyles = await this.client.send('CSS.getMatchedStylesForNode', { nodeId: nodeId });
      
        const inheritedStyled = _.flatten(elStyles.inherited.map((is) => is.matchedCSSRules));
        const applicableStyles = [].concat(inheritedStyled, elStyles.matchedCSSRules);
        const applicationStyles = applicableStyles.filter((matchedRule) => {
            return matchedRule.rule.origin !== 'user-agent';
        }).map((matchedRule) => {
            return matchedRule.rule.style.cssText;
        });
        return applicationStyles;
    }
    async createVDOMComponent($, el) {
        const domEl = $(el).get(0);
        const nodeId = $(el).data('nodeid');
        let appliedStyles = [];
        const tag = domEl.tagName;
        if (nodeId) {
            try {
                appliedStyles = await this.getAppliedStyles(parseInt(nodeId));
            } catch(e) {
                console.log(e, nodeId);
                appliedStyles = [];
            }
        }
        // Acount for custom tags and the body tag
        const normalizedTagName = (tag.split('-').length > 1 || tag === 'body') ? 'div' : tag;
        const customTag = {
            props: {},
            tag: normalizedTagName,
            children: [],
            custom: true,
            appliedStyles: [],
            styled: [],
            styledCompNames: [],
            imports: [] 
        };
        let componentName = await this.compoundComponentDetector.detect(domEl);

        if (tag === 'svg') {
            customTag.tag = 'svg';
        }
        if (componentName) {
            return Object.assign({}, customTag, {
                componentName
            });
        }

        if (tag !== 'script' && tag !== 'link') {
            return {
                componentName: normalizedTagName,
                tag: normalizedTagName,
                props: domEl.attribs,
                appliedStyles,
                children: [],
                custom: false,
                imports: []
            };
        }
    }
    async mapToVDOM($, el) {
        const tag = await this.createVDOMComponent($, el);
       
        if (tag) {
            const children = $(el).children().toArray();
            const text = $(el).text();
            if (children.length > 0) {
                for(const child of children) {
                    tag.children.push(await this.mapToVDOM($, child));
                }
                tag.children = tag.children.filter((c) => !!c);
            } else if(text) {
                tag.children.push(text);
            }
            return tag;
        }
    }
    async generate(html) {
        const $ = cheerio.load(html);
        const pageVDOM = await this.mapToVDOM($, $('body'));
        await this.writeVDOM(pageVDOM);
    }
    writeVDOM(el, parentEl) {
        if (el.custom) {
            const filename = `${el.componentName}.js`;
            this.codeGenerator.createCodeFromVDOM(el, parentEl);
            const ast = this.codeGenerator.createReactComponentFile(el);
            this.writeFile(filename, ast);
        }
        if (typeof el === 'object') {
            el.children.forEach((child) => {
                this.writeVDOM(child, el);
            });
        }
    }
    writeFile(filename, codeAst) {
        const code = this.codeGenerator.formatCode(codeAst);
        this.projectFilesGenerator.generateComponent(filename, code);
    }
}
module.exports = ReactComponentGenerator;