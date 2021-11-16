const puppeteer = require('puppeteer-core');
const http = require('http');
const axios = require('axios');

const mlaPort = 10000;

const endpointNext = "https://df.scrapcars.dev/webhook/listing/next"
const endpointPhone = "https://df.scrapcars.dev/webhook/listing/phone"
const endpointInvalid = "https://df.scrapcars.dev/webhook/listing/invalid"

async function startProfile() {
    const response = await axios.post(`http://localhost.multiloginapp.com:${mlaPort}/api/v2/profile`, {
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
        await new Promise(r => setTimeout(r, 30000));
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
        resp.on('end', async () => {
            let ws;
            try {
                ws = JSON.parse(data);
            } catch (err) {
                console.log(err);
            }
            if (typeof ws === 'object' && ws.hasOwnProperty('value')) {
                console.log(`Browser websocket endpoint: ${ws.value}`);
                run(ws.value);

                await axios.delete(`http://localhost.multiloginapp.com:${mlaPort}/api/v2/profile/${response.data.uuid}`);
            }
        });

    }).on("error", (err) => {
        console.log(err.message);
    });

    await new Promise(r => setTimeout(r, 30000));
    console.log('30 second cooldown...')
}

async function run(ws) {
    const browser = await puppeteer.connect({ browserWSEndpoint: ws, defaultViewport: null });

    try {
        const { data } = await axios.get(endpointNext);

        if (!data.listing.url) {
            console.log("Listing API did not provide URL")
            return;
        }

        console.log("scraping url", data.listing.url)

        //Connecting Puppeteer with Mimic instance and performing simple automation.        
        const page = await browser.newPage();
        await page.authenticate({ 'username': 'user-2cresidential-sessionduration-10', 'password': 'IocCQ1PF823sjcpMcGlJRq' });
        await page.goto(data.listing.url);

        console.log("clicking reply...")
        let replyNotFound;

        await page.waitForSelector(".reply-button", { timeout: 2000 }).catch(async () => {
            console.log("no phone reply option, making invalid")
            await axios.post(endpointInvalid, { listing: data.listing.id });
            replyNotFound = true
        });

        if (replyNotFound) {
            return;
        }

        const reply = await page.$('.reply-button');
        await reply.click()

        let phoneReplyNotFound;

        await page.waitForSelector(".show-phone", { timeout: 5000 }).catch(async () => {
            console.log("no phone reply option, making invalid")
            await axios.post(endpointInvalid, { listing: data.listing.id });
            phoneReplyNotFound = true
        });

        if (phoneReplyNotFound) {
            return;
        }

        const phone = await page.$('.show-phone');
        await phone.click()

        await page.waitForSelector("#reply-tel-number");
        await page.waitForFunction('document.querySelector("#reply-tel-number").innerText.length > 0');

        const phoneNumberContainer = await page.$('#reply-tel-number')
        const phoneNumber = await page.evaluate(el => el.textContent, phoneNumberContainer)

        if (phoneNumber) {
            console.log('posting phone', phoneNumber);
        }

        await axios.post(endpointPhone, {
            listing: data.listing.id,
            phone: phoneNumber,
        });
    } catch (err) {
        console.log(err.message);
    } finally {
        await browser.close();
    }
}

startProfile();