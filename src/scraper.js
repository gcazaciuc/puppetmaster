const puppeteer = require('puppeteer');
const rimraf = require('rimraf');
const path = require('path');
const debug = require('debug')('react-puppet:scraper');

class Scraper {
    constructor(projectFilesGenerator, componentGenerator) {
        this.componentGenerator = componentGenerator;
        this.projectFilesGenerator = projectFilesGenerator;
    }
    async scrape(url) {
        rimraf.sync(path.resolve('output'));
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(url);
        const client = await page.target().createCDPSession();
        await client.send('DOM.enable');
        await client.send('CSS.enable');
        this.componentGenerator.setClient(client);
        debug('Marking HTML nodes with DevTool node ids');
        await this.markNodes(page, client);
        debug('Parsing html and creating VDOM nodes');
        await this.parsePageHtml(page);
        debug('Writing project files into the output directory');
        this.projectFilesGenerator.generate(); 
        await browser.close();
        debug('Done generating project...');
    }
    async markNodes(page, client) {
        const doc = await client.send('DOM.getDocument');
        const nodes = await client.send('DOM.querySelectorAll', {
            nodeId: doc.root.nodeId,
            selector: '*'
        });

        for(let nodeId of nodes.nodeIds) {
            await client.send('DOM.setAttributeValue', {
                nodeId,
                name: 'data-nodeid',
                value: JSON.stringify(nodeId)
            });
        }
    }
    async parsePageHtml(page) {
        const bodyHandle = await page.$('html');
        const html =  await page.evaluate((body) => body.innerHTML , bodyHandle);
        await this.componentGenerator.generate(html);
    }
}

module.exports = Scraper;