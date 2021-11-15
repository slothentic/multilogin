const puppeteer = require('puppeteer-core');
const http = require('http');
const axios = require('axios');

const mlaPort = 10000;

async function startProfile() {
    const response = await axios.post("http://localhost.multiloginapp.com:10000/api/v2/profile", {
        "name": "Temporary Profile (CL)",
        "os": "win",
        "browser": "mimic",
        "network": {
            "proxy": {
                "type": "HTTP",
                "host": "us.smartproxy.com",
                "port": "10005",
                "username": "user-2cresidential-sessionduration-1",
                "password": "IocCQ1PF823sjcpMcGlJRq"
            }
        }
    });

    if (!('uuid' in response.data)) {
        console.log('failed to create profile')
        process.exit()
    }

    console.log('created profile', response.data.uuid)

    const localUrl = `http://127.0.0.1:${mlaPort}/api/v1/profile/start?automation=true&puppeteer=true&profileId=${response.data.uuid}`;

    /*Send GET request to start the browser profile by profileId.
    Returns web socket as response which should be passed to puppeteer.connect*/
    http.get(localUrl, (resp) => {
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

        await page.waitForSelector("#reply-tel-number")
        await page.waitForFunction('document.querySelector("#reply-tel-number").innerText.length > 0');
        const phoneNumberContainer = await page.$('#reply-tel-number')
        const phoneNumber = await page.evaluate(el => el.textContent, phoneNumberContainer)

        console.log("phoneNumber", phoneNumber)
        
        await browser.close();
    } catch (err) {
        console.log(err.message);
    }
}

startProfile();