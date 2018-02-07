const Scraper = require('./scraper');
const CompoundComponentDetector = require('../src/compound-component-detector');
const ProjectFilesGenerator = require('../src/project-files-generator');
const ReactComponentGenerator = require('../src/react-component-generator');
const CodeGenerator = require('../src/code-generator');
const WordPOS = require('wordpos');

describe('Scraper component test suite', () => {
    let scraper = null;
    let projectFilesGenerator = null;
    let wordpos = null;
    let compoundDetector = null;
    let componentGenerator = null;
    let codeGenerator = null;
    beforeEach(() => {
        wordpos = new WordPOS();
        compoundDetector = new CompoundComponentDetector(wordpos);
        projectFilesGenerator = {
            generate: jest.fn(),
            generateComponent: jest.fn()
        };
        codeGenerator = new CodeGenerator();
        componentGenerator = new ReactComponentGenerator(
            projectFilesGenerator, 
            compoundDetector, 
            codeGenerator
        );
        scraper = new Scraper(projectFilesGenerator, componentGenerator);
    });

    it('Should properly parse the HTML and generate components', async () => {
        await scraper.scrape('file:///home/gabrielcazaciuc/react-puppet/fixtures/simple.html');
        const [firstCall] = projectFilesGenerator.generateComponent.mock.calls;
        expect(firstCall[0]).toBe('Application.js');
        expect(firstCall[1]).toMatchSnapshot();
    });
});