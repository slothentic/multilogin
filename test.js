const puppeteer = require('puppeteer-core');
const http = require('http');


async function startProfile() {
    //Replace profileId value with existing browser profile ID.
    let profileId = '6796662a-52ab-4edc-b6eb-3819e96bfad3';
    let mlaPort = 10000;

    /*Send GET request to start the browser profile by profileId.
    Returns web socket as response which should be passed to puppeteer.connect*/
    http.get(`http://127.0.0.1:${mlaPort}/api/v1/profile/start?automation=true&puppeteer=true&profileId=${profileId}`, (resp) => {
        let data = '';
        let ws = '';

        //Receive response data by chunks
        resp.on('data', (chunk) => {
            data += chunk;
        });

        /*The whole response data has been received. Handling JSON Parse errors,
        verifying if ws is an object and contains the 'value' parameter.*/
        resp.on('end', () => {
            let ws;
            try {
                ws = JSON.parse(data);
            } catch (err) {
                console.log(err);
            }
            if (typeof ws === 'object' && ws.hasOwnProperty('value')) {
                console.log(`Browser websocket endpoint: ${ws.value}`);
                run(ws.value);
            }
        });

    }).on("error", (err) => {
        console.log(err.message);
    });
}

async function run(ws) {
    try {
        //Connecting Puppeteer with Mimic instance and performing simple automation.
        const browser = await puppeteer.connect({ browserWSEndpoint: ws, defaultViewport: null });
        const page = await browser.newPage();
        await page.authenticate({ 'username': 'user-2cresidential-sessionduration-10', 'password': 'IocCQ1PF823sjcpMcGlJRq' });
        await page.goto('https://sfbay.craigslist.org/pen/cto/d/millbrae-2005-honda-civic/7408094868.html');

        console.log("clicking reply...")

        await page.waitForSelector(".reply-button")
        const reply = await page.$('.reply-button');
        await reply.click()

        await page.waitForSelector(".show-phone")
        const phone = await page.$('.show-phone');
        await phone.click()

        console.log("clicked")

        await page.waitForTimeout(3000)

        // await page.screenshot({ path: `/Users/dfratus/Desktop/test.png` });

        // await browser.close();
    } catch (err) {
        console.log(err.message);
    }
}

startProfile();