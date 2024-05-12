const fetch = require("node-fetch");

const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log("Simple script to clear all subscriptions to Websocket, useful for development.");
  console.log("Usage: node script.js <Authorization Token> <Client ID>");
  process.exit(1);
}

const [authorizationToken, clientId] = args;

const myHeaders = new fetch.Headers();
myHeaders.append("Authorization", `Bearer ${authorizationToken}`);
myHeaders.append("Client-Id", clientId);


async function main() {
  try {
    const requestOptionsGet = {
      method: 'GET',
      headers: myHeaders
    };
    const response = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", requestOptionsGet);
    const result = await response.json();
    
    const ids = result.data.map(item => item.id);
    
    const requestOptionsDelete = {
      method: 'DELETE',
      headers: myHeaders
    };
    for (const id of ids) {
      console.log(`Delete ${id}...`);
      const deleteResponse = await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${id}`, requestOptionsDelete);
      console.log(await deleteResponse.text());
    }
    
    const newResponse = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", requestOptionsGet);
    const newResult = await newResponse.json();
    console.log(newResult);
  }
  catch (error) {
    console.log('error', error);
  }
}

main();
