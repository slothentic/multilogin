const axios = require('axios');

const mlaPort = 10000;
const baseUrl = `http://localhost.multiloginapp.com:${mlaPort}/api/v2`

const nameToDelete = "Temporary Profile (CL)";

async function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

var iteration = 0;

(async () => {
    const { data } = await axios.get(`${baseUrl}/profile`);

    data.forEach(async (profile) => {
        iteration++

        setTimeout(async () => {
            if (profile.name === nameToDelete) {
                console.log(`Deleting profile ${profile.name} [${profile.uuid}]`);

                const response = await axios.delete(`${baseUrl}/profile/${profile.uuid}`);

                console.log(`Status: ${response.status}`);
            }
        }, iteration * 10000)
    })
})();