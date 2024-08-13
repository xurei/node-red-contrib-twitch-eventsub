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

type Status = {
  fill: 'red' | 'green' | 'yellow' | 'blue' | 'grey';
  shape: 'ring' | 'dot';
  text: string;
}

module.exports = function (RED: Red) {
  class TwitchEventsubConfig extends AbstractNode {
    config: TwitchEventsubConfigProps;
    twitchEventsub: TwitchEventsub;
    nodeListeners: {[key: string]: Node} = {};
    currentStatus: Status = {
      fill: 'grey',
      shape: 'ring',
      text: 'Connecting...',
    };
    initialized: boolean = false;

    constructor(config: TwitchEventsubConfigProps) {
      super(config, RED);
      this.config = config;
      this.twitchEventsub = new TwitchEventsub(this, config.broadcaster_id, config.twitch_client_id, config.twitch_client_secret);
      this.on('close', (done: () => void) => {
        this.takedown().then(done);
      });
    }

    init() {
      this.twitchEventsub.init(this.config.twitch_refresh_token)
        .then(async () => {
          this.log('Twitch auth success; adding subscriptions');
          this.updateStatus({
            fill: 'green',
            shape: 'ring',
            text: 'Subscribing to events...',
          });
          this.twitchEventsub.onEventCb = (e) => {
            Object.values(this.nodeListeners).forEach(node => {
              (node as any).triggerTwitchEvent(e);
            });
          };

          try {
            await this.twitchEventsub.addSubscriptions();
            this.updateStatus({
              fill: 'green',
              shape: 'dot',
              text: `Ready`,
            });
          }
          catch(e) {
            this.updateStatus({
              fill: 'red',
              shape: 'dot',
              text: `Subscriptions failed: ${(e as Error).message}`,
            });
          }
        })
        .catch((e: Error) => {
          this.error(`TwitchEventsubConfig: auth failed`);
          this.updateStatus({
            fill: 'red',
            shape: 'ring',
            text: `Twitch auth failed`,
          });
        });
      this.initialized = true;
    }

    async takedown() {
      this.log('Stopping twitch event listener');
      await this.twitchEventsub.stop();
      this.updateStatus({
        fill: 'grey',
        shape: 'ring',
        text: 'Disconnected',
      });
      this.initialized = false;
      this.log('Stopped twitch event listener');
    }

    updateStatus(status: Status) {
      this.currentStatus = status;
      Object.values(this.nodeListeners).forEach(node => {
        (node as any).status(status);
      });
    }

    addNode(id: string, node: Node): void {
      this.log(`addNode ${id}`);
      this.nodeListeners[id] = node;
      (node as any).status(this.currentStatus);
      if (!this.initialized) {
        this.init();
      }
    }

    async removeNode(id: string, done: () => void): Promise<void> {
      delete this.nodeListeners[id];
      if (Object.keys(this.nodeListeners).length === 0) {
        await this.takedown();
      }
      done();
    }
  }

  RED.nodes.registerType('twitch-eventsub-config', TwitchEventsubConfig);
}
