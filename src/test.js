require('dotenv').config()
const shared = require('./shared');


const endpoint = process.env.ENDPOINT;
const apiToken = process.env.TOKEN;
const serverId = process.env.SERVER;
if (!endpoint) {
    throw new Error("Missing ENDPOINT");
}
if (!apiToken) {
    throw new Error("Missing TOKEN");
}
if (!serverId) {
    throw new Error("Missing SERVER");
}
shared.setAxios(endpoint, apiToken);


(async () => {
    const lastPowerState = await shared.getResource(serverId)
    if (lastPowerState.attributes.current_state === "offline") {
        console.log("Server is offline, starting it")
        console.log(await shared.setPowerState(serverId, "start"))
        await shared.waitUntilPowerState(serverId, "running", 120)
    }
    const restartRes = await shared.restartServer(serverId, true)
    console.log(lastPowerState);
    console.log(restartRes);
    const newPowerState = await shared.getResource(serverId)
    console.log(newPowerState.attributes.current_state);
    console.log("Finished")
})()
