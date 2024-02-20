//const eventSubDeDurss = require('./twitch-eventsub-lib');

import {Red, NodeProperties} from 'node-red';
import {Node} from './Node';

class TwitchEventsubConfig_ extends Node {
  nodeListeners: {[key: string]: Node} = {};

  constructor(RED: Red, config: NodeProperties) {
    super(RED);
    this.createNode(config);
    // TODO start twurple service and listen to events
  }

  addNode(id: string, node: Node): void {
    console.log(`ADD NODE ${id}`);
    this.nodeListeners[id] = node;
  }
  removeNode(id: string): void {
    console.log(`REMOVE NODE ${id}`);
    delete this.nodeListeners[id];
  }
}

module.exports = function TwitchEventsubConfig(RED: Red) {
  TwitchEventsubConfig_.registerType(RED, 'twitch-eventsub-config');

  // function TwitchEventSubConfig(properties: NodeProperties) {
  //   RED.nodes.createNode(this, properties);
  //
  //   // const server = eventSubDeDurss.init({
  //   //   port: n.port,
  //   //   ngrok_token: n.ngrok_token,
  //   //   broadcaster_id: n.broadcaster_id,
  //   //   twitch_client_id: n.client_id,
  //   //   twitch_client_secret: n.client_secret,
  //   //   twitch_eventsub_secret: n.eventsub_secret,
  //   // });
  //
  //   server.onTwitchEvent((event) => {
  //     Object.values(nodeListeners).forEach(node => {
  //       node.triggerTwitchEvent(event);
  //     });
  //   });
  // }
  // RED.nodes.registerType('twitch-eventsub-config', TwitchEventSubConfig);
}
