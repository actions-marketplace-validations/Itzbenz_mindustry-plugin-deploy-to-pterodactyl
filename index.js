const core = require('@actions/core');
const Axios = require('axios');
const fs = require('fs');

// most @actions toolkit packages have async methods
async function run() {
    try {
        const artifactPath = core.getInput('artifactPath', {required: true});
        const artifactName = artifactPath.split('/').pop();
        const endpoint = core.getInput('endpoint', {required: true, trimWhitespace: true});
        const token = core.getInput('token', {required: true, trimWhitespace: true});
        const serverId = core.getInput('serverId', {required: true, trimWhitespace: true});
        const doRestart = core.getInput('doRestart', {required: false, trimWhitespace: true}) === 'true';
        const targetPath = core.getInput('targetPath', {
            required: false,
            trimWhitespace: true
        }) || `config/mods/${artifactName}`;


        const buffer = fs.readFileSync(artifactPath);

        const axios = Axios.create({
            baseURL: endpoint,
            headers: {
                Authorization: `Bearer ${token}`,
                "Accept": "application/json",
            }
        });
        if (doRestart) {
            //alert the horde (optional)
            core.info("Alerting the horde");
            try {
                await axios.post(`/api/client/servers/${serverId}/command`, {
                    command: "say Server is restarting in 10 seconds (maybe)",
                });
            } catch (e) { /* empty */
            }
        }
        core.info(`Uploading ${artifactName} to ${targetPath}`);
        //upload file
        /**
         * curl "https://pterodactyl.file.properties/api/client/servers/1a7ce997/files/write?file=%2Feula.txt" \
         *   -H 'Accept: application/json' \
         *   -H 'Authorization: Bearer apikey' \
         *   -X POST \
         *   -b 'pterodactyl_session'='eyJpdiI6InhIVXp5ZE43WlMxUU1NQ1pyNWRFa1E9PSIsInZhbHVlIjoiQTNpcE9JV3FlcmZ6Ym9vS0dBTmxXMGtST2xyTFJvVEM5NWVWbVFJSnV6S1dwcTVGWHBhZzdjMHpkN0RNdDVkQiIsIm1hYyI6IjAxYTI5NDY1OWMzNDJlZWU2OTc3ZDYxYzIyMzlhZTFiYWY1ZjgwMjAwZjY3MDU4ZDYwMzhjOTRmYjMzNDliN2YifQ%3D%3D' \
         *   -d '#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://account.mojang.com/documents/minecraft_eula).
         * #You also agree that tacos are tasty, and the best food in the world.
         * #Wed Dec 25 05:20:41 UTC 2019
         * eula=true
         * '
         * @type {axios.AxiosResponse<any>}
         */
        const uploadFileResponse = await axios.post(`/api/client/servers/${serverId}/files/write`, buffer, {
            params: {
                file: targetPath,
            }
        });
        console.log(uploadFileResponse.data);

        if (doRestart) {
            core.info("Restarting server");
            const restartResponse = await axios.post(`/api/client/servers/${serverId}/power`, {
                signal: "restart",
            });
            console.log(restartResponse.data);
        }

    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
