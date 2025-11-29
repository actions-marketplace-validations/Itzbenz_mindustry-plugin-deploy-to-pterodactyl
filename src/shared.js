const Axios = require('axios');

const axios = Axios.create({

    headers: {
        "Accept": "application/json",
    }
});

function setAxios(baseURL, apiToken) {
    axios.defaults.baseURL = baseURL;
    axios.defaults.headers.common['Authorization'] = `Bearer ${apiToken}`;
}

async function setPowerState(serverId, signal) {
    return (await axios.post(`/api/client/servers/${serverId}/power`, {
        signal: signal,
    })).data;
}
async function sendCommand(serverId, command) {
    return (await axios.post(`/api/client/servers/${serverId}/command`, {
        command: command,
    })).data;
}
async function getResource(serverId) {
    return (await axios.get(`/api/client/servers/${serverId}/resources`)).data;
}

async function waitUntilPowerState(serverId, state, timeout=30) {
    let secondsPassed = 0;
    let resource ;
    while ((resource = await getResource(serverId)).attributes.current_state !== state) {
        await new Promise(r => setTimeout(r, 1000));
        secondsPassed++;
        console.log(`Waiting for server to enter ${state}, ${secondsPassed} seconds passed, current state is ${resource.attributes.current_state}`);
        if (secondsPassed > timeout) {
            throw new Error(`Server did not enter ${state} in time`);
        }
    }
}

async function restartServer(serverId, force=false) {
    const earlyState = (await getResource(serverId)).attributes.current_state;
    if (earlyState !== "running") {
        throw new Error(`Server is not running, current state is ${earlyState}`);
    }
    if(force){
        //kill
        await setPowerState(serverId, "kill");
        //wait for it to stop
        await waitUntilPowerState(serverId, "offline");
        //start
        await setPowerState(serverId, "start");
    }else{
        //restart
        await setPowerState(serverId, "restart");
    }
}

module.exports = {
    axios,
    setAxios,
    setPowerState,
    sendCommand,
    getResource,
    restartServer,
    waitUntilPowerState,
}
