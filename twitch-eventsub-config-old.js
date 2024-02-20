const eventSubDeDurss = require('./twitch-eventsub-lib');

const nodeListeners = {};
module.exports = function(RED) {
  function TwitchEventSubConfig(n) {
    RED.nodes.createNode(this, n);
  
    const server = eventSubDeDurss.init({
      port: n.port,
      ngrok_token: n.ngrok_token,
      broadcaster_id: n.broadcaster_id,
      twitch_client_id: n.client_id,
      twitch_client_secret: n.client_secret,
      twitch_eventsub_secret: n.eventsub_secret,
    });
  
    server.onTwitchEvent((event) => {
      Object.values(nodeListeners).forEach(node => {
        node.triggerTwitchEvent(event);
      });
    });
  
    this.addNode = (id, node) => {
      nodeListeners[id] = node;
    };
    this.removeNode = (id) => {
      delete nodeListeners[id];
    };
  }
  RED.nodes.registerType('twitch-eventsub-config', TwitchEventSubConfig);
}
