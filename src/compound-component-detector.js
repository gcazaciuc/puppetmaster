
const upperFirst = require('lodash.upperfirst');
class CompoundComponentDetector {
    constructor(wordpos) {
        this.wordpos = wordpos;
    }
    isSplitPoint(domEl) {
        if(domEl.tagName === 'body') {
            return true;
        }
        if (domEl.tagName === 'svg' || 
            domEl.tagName === 'nav' || 
            domEl.tagName === 'header' || 
            domEl.tagName === 'ul') {
            return true;
        }

        if (domEl.tagName === 'div' && (domEl.attribs.id || domEl.attribs.role)) {
            return true;
        }
    }
    async detect(domEl) {
        if (!this.isSplitPoint(domEl)) {
            return null;
        }

        if (domEl.tagName === 'body') {
            return 'Application';
        }

        const { class: className, id } = domEl.attribs;
        if (!className) {
            return '';
        }
        const allClasses = className.split(' ');
        
        const jsClass = allClasses.find((cls) => cls.indexOf('js-') === 0);
        if (jsClass) {
            return jsClass.split('-').slice(1).map(upperFirst).join('');
        }
        const semanticClasses = allClasses.filter(
            (cls) => cls.indexOf('js-') === -1
        );

        const nouns = await this.wordpos.getNouns(semanticClasses.join(' '));
        const terms = nouns.filter((n) => n.length > 2);
        return terms.map(upperFirst).join('');
    }
} 
module.exports = CompoundComponentDetector;