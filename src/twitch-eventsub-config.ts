import type {Red} from './Red';
import { AbstractNode } from './AbstractNode';
import {TwitchEventsub} from './twitch-eventsub-service';

type TwitchEventsubConfigProps = {
  broadcaster_id: number;
  twitch_client_id: string;
  twitch_client_secret: string;
  twitch_auth_token: string;
  twitch_refresh_token: string;
}

module.exports = function (RED: Red) {
  class TwitchEventsubConfig extends AbstractNode {
    twitchEventsub: TwitchEventsub;
    nodeListeners: {[key: string]: Node} = {};

    constructor(config: TwitchEventsubConfigProps) {
      super(config, RED);
      this.twitchEventsub = new TwitchEventsub(config.broadcaster_id, config.twitch_client_id, config.twitch_client_secret);

      this.on('close', () => {
        console.log('Stopping twitch event listener');
        this.twitchEventsub.stop();
      });

      this.twitchEventsub.init(config.twitch_refresh_token).then(() => {
        console.log('Twitch auth success; adding event listener');
        this.twitchEventsub.onEventCb = (e) => {
          Object.values(this.nodeListeners).forEach(node => {
            (node as any).triggerTwitchEvent(e);
          });
        };
        this.twitchEventsub.start();
      }).catch(e => {
        console.error(`TwitchEventsubConfig: ${e}`);
      });
    }

    addNode(id: string, node: Node): void {
      this.nodeListeners[id] = node;
    }
    removeNode(id: string): void {
      delete this.nodeListeners[id];
    }
  }

  RED.nodes.registerType('twitch-eventsub-config', TwitchEventsubConfig);
}
