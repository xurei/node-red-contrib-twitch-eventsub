//const eventSubDeDurss = require('./twitch-eventsub-lib');
import type {Red} from './Red';
import { AbstractNode } from './AbstractNode';
import { NodeStatus, Shape, Fill } from './node_status';
import {TwitchEventsub} from './twitch-eventsub-service';

module.exports = function (RED: Red) {
  class TwitchEventsubConfig extends AbstractNode {
    twitchEventsub: TwitchEventsub;
    nodeListeners: {[key: string]: Node} = {};

    constructor(config: any) {
      console.log('TwitchEventsubConfig.constructor', config);
      super(config, RED);
      console.log('TwitchEventsubConfig.constructor', config);
      this.twitchEventsub = new TwitchEventsub(config.twitch_client_id, config.broadcaster_id, config.twitch_auth_token);
      this.twitchEventsub.onEventCb = (e) => {
        Object.values(this.nodeListeners).forEach(node => {
          (node as any).triggerTwitchEvent(e);
        });
      };
      this.twitchEventsub.start();
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

  RED.nodes.registerType('twitch-eventsub-config', TwitchEventsubConfig);
}
// module.exports = function TwitchEventsubConfig(RED: Red) {
//   TwitchEventsubConfig_.registerType(RED, 'twitch-eventsub-config');
//
//   // function TwitchEventSubConfig(properties: NodeProperties) {
//   //   RED.nodes.createNode(this, properties);
//   //
//   //   // const server = eventSubDeDurss.init({
//   //   //   port: n.port,
//   //   //   ngrok_token: n.ngrok_token,
//   //   //   broadcaster_id: n.broadcaster_id,
//   //   //   twitch_client_id: n.client_id,
//   //   //   twitch_client_secret: n.client_secret,
//   //   //   twitch_eventsub_secret: n.eventsub_secret,
//   //   // });
//   //
//   //   server.onTwitchEvent((event) => {
//   //     Object.values(nodeListeners).forEach(node => {
//   //       node.triggerTwitchEvent(event);
//   //     });
//   //   });
//   // }
//   // RED.nodes.registerType('twitch-eventsub-config', TwitchEventSubConfig);
// }
