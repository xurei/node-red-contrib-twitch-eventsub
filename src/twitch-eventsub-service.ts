import {RefreshingAuthProvider} from '@twurple/auth';
import {ApiClient} from '@twurple/api';
import {EventSubWsListener} from '@twurple/eventsub-ws';
import type {EventSubSubscription} from '@twurple/eventsub-base/lib/subscriptions/EventSubSubscription';
import {AbstractNode} from '/@/AbstractNode';
import {DataObject, getRawData, type UserIdResolvable} from '@twurple/common';
import {HelixUser} from '@twurple/api/lib/endpoints/user/HelixUser';
import {EventSubListener} from '@twurple/eventsub-base';

type TwitchEvent = {
  eventType: string;
  userId: number;
  userName?: string | null | undefined;
  userDisplayName?: string | null | undefined;
  rawEvent: unknown;
};
type TwitchEventFollow = TwitchEvent;
type TwitchEventRedeem = TwitchEvent & {
  rewardId: string;
  rewardName: string;
  rewardMessage: string;
};
type TwitchEventRaid = TwitchEvent & {
  viewers: number;
};
type TwitchEventsubSubscribe = TwitchEvent & {
  tier: number;
};
type TwitchEventSubGift = TwitchEvent & {
  tier: number;
  amount: number;
};
type TwitchEventBits = TwitchEvent & {
  amount: number;
};
type TwitchEventStreamOnline = TwitchEvent & {
  streamDetails: unknown;
};

type EventSubSubscriptionWithStatus = {
  subscription: EventSubSubscription;
  //statusPromise: Promise<void>;
  updateStatus: (error: Error | null) => void;
};

function renameEventFromFnName(fname: string) {
  fname = fname.substring(2);
  return `${fname[0].toLowerCase()}${fname.substring(1)}`;
}

class TwitchEventsub {
  clientId?: string | null;
  userId?: number | null;
  user!: HelixUser | null;
  authProvider: RefreshingAuthProvider;
  apiClient!: ApiClient;
  listener!: EventSubWsListener;
  subscriptions: EventSubSubscriptionWithStatus[] = [];
  node: AbstractNode;

  onEventCb?: (event: TwitchEvent) => void;

  onAuthError?: () => void;

  constructor(node: AbstractNode, userId: number, clientId: string, clientSecret: string) {
    this.node = node;
    this.node.log('NEW TwitchEventsub', clientId, userId);
    this.userId = userId;
    this.clientId = clientId;
    this.authProvider = new RefreshingAuthProvider({
      clientId: clientId,
      clientSecret: clientSecret,
    });
  }

  async init(refreshToken: string): Promise<void> {
    if (!this.userId) {
      return;
    }

    //@ts-ignore
    await this.authProvider.addUserForToken({
      accessToken: '',
      refreshToken: refreshToken,
    });

    this.apiClient = new ApiClient({authProvider: this.authProvider});
    this.listener = new EventSubWsListener({apiClient: this.apiClient});

    this.user = await this.apiClient.users.getUserById(this.userId ?? 0);

    this.listener.onSubscriptionCreateSuccess((subscription) => {
      this.node.log(`Subscription Created: ${subscription.id}`);
      const subscriptionWithStatus = this.subscriptions.find(s => s.subscription.id === subscription.id);
      if (subscriptionWithStatus) {
        subscriptionWithStatus.updateStatus(null);
      }
    });

    this.listener.onSubscriptionCreateFailure((subscription, error) => {
      this.node.error(`Subscription Failed: ${subscription.id}`);
      const subscriptionWithStatus = this.subscriptions.find(s => s.subscription.id === subscription.id);
      if (subscriptionWithStatus) {
        const errMsgEndPos = error.message.indexOf(') and can not be upgraded.');
        if (errMsgEndPos !== -1) {
          error.message = error.message.substring(0, errMsgEndPos + 1);
        }
        subscriptionWithStatus.updateStatus(error);
      }
      if (this.onAuthError) {
        this.node.log('ON AUTH ERROR');
        this.onAuthError();
      }
    });
  }

  async addSubscriptions(): Promise<void> {
    if (!this.userId) {
      return;
    }

    const createEvent = <R extends DataObject<unknown>>(eventType: string) => {
      return (event: R) => {
        const payload: TwitchEvent = {
          eventType: eventType,
          userId: this.userId ?? 0,
          userName: this.user?.name,
          userDisplayName: this.user?.displayName,
          rawEvent: getRawData(event),
        };
        payload.userId = parseInt(`${payload.userId}`);
        if (this.onEventCb) {
          this.onEventCb(payload);
        }
      };
    };

    const hardCodedSubFunctions: string[] = [
      'onSubscriptionCreateSuccess',
      'onSubscriptionCreateFailure',
      'onStreamOnline',
      'onChannelRedemptionAdd',
      'onChannelRaidTo',
      'onChannelSubscription',
      'onChannelSubscriptionGift',
      'onChannelFollow',
      'onChannelCheer',
    ];
    const ignoredSubFunctions: string[] = [
      'onChannelRewardUpdateForReward', // arg is reward Id, needs to be hardcoded or transformer updated
      'onChannelRewardRemoveForReward', // arg is reward Id, needs to be hardcoded or transformer updated
      'onChannelRedemptionAddForReward', // arg is reward Id, needs to be hardcoded or transformer updated
      'onChannelRedemptionUpdateForReward', // arg is reward Id, needs to be hardcoded or transformer updated
    ];

    const subscriptionFns0Arg = (
      // @ts-expect-error returns all functions matching the second argument; See transformers/getKeysOfType.ts
      getKeysOfType<EventSubListener, (user: UserIdResolvable, handler: (event: DataObject<unknown>) => void) => EventSubSubscription>()
        .filter((f: string) => f.startsWith('on') && !hardCodedSubFunctions.includes(f))
    );
    const subscriptionFns1Arg = (
      // @ts-expect-error returns all functions matching the second argument; See transformers/getKeysOfType.ts
      getKeysOfType<EventSubListener, (user: UserIdResolvable, other: string, handler: (event: DataObject<unknown>) => void) => EventSubSubscription>()
        .filter((f: string) => f.startsWith('on') && !hardCodedSubFunctions.includes(f))
        .filter((f: string) => !ignoredSubFunctions.includes(f))
    );
    this.node.log('Currently ignored 1arg subscriptions:\n', '- ' + ignoredSubFunctions.join('\n - '));

    const promises = Promise.all([
      this.addSubscription(this.listener.onStreamOnline(this.userId, async (event) => {
        //createEvent('streamOnline')
        //this.node.log('STREAM ONLINE');
        const streamDetails = await event.getStream();
        const payload: TwitchEventStreamOnline = {
          eventType: 'streamOnline',
          userId: this.userId ?? 0,
          userName: this.user?.name,
          userDisplayName: this.user?.displayName,
          streamDetails: streamDetails ? getRawData(streamDetails) : null,
          rawEvent: getRawData(event),
        };
        payload.userId = parseInt(`${payload.userId}`);
        if (this.onEventCb) {
          this.onEventCb(payload);
        }
      })),
      //this.addSubscription(this.listener.onA(this.userId, createEvent('streamOffline'))),
      this.addSubscription(
        this.listener.onChannelRedemptionAdd(this.userId, (event) => {
          const payload: TwitchEventRedeem = {
            eventType: 'redeem',
            userId: parseInt(event.userId),
            userName: event.userName,
            userDisplayName: event.userDisplayName,
            rewardId: event.rewardId,
            rewardName: event.rewardTitle,
            rewardMessage: event.input,
            rawEvent: getRawData(event),
          };
          this.node.log('REDEEM', JSON.stringify(payload, null, '  '));
          if (this.onEventCb) {
            this.onEventCb(payload);
          }
        })
      ),

      this.addSubscription(
        this.listener.onChannelRaidTo(this.userId, (event) => {
          const payload: TwitchEventRaid = {
            eventType: 'raid',
            userId: parseInt(event.raidingBroadcasterId),
            userName: event.raidingBroadcasterName,
            userDisplayName: event.raidingBroadcasterDisplayName,
            viewers: event.viewers,
            rawEvent: getRawData(event),
          };
          this.node.log('RAID', JSON.stringify(payload, null, '  '));
          if (this.onEventCb) {
            this.onEventCb(payload);
          }
        })
      ),

      this.addSubscription(
        this.listener.onChannelSubscription(this.userId, (event) => {
          const payload: TwitchEventsubSubscribe = {
            eventType: 'subscribe',
            userId: parseInt(event.userId),
            userName: event.userName,
            userDisplayName: event.userDisplayName,
            tier: parseInt(event.tier),
            rawEvent: getRawData(event),
          };
          this.node.log('SUB', JSON.stringify(payload, null, '  '));
          if (this.onEventCb && !event.isGift) {
            this.onEventCb(payload);
          }
        })
      ),

      this.addSubscription(
        this.listener.onChannelSubscriptionGift(this.userId, (event) => {
          const payload: TwitchEventSubGift = {
            eventType: 'subscribeGift',
            userId: parseInt(event.gifterId),
            userName: event.gifterName,
            userDisplayName: event.gifterDisplayName,
            tier: parseInt(event.tier),
            amount: event.amount,
            rawEvent: getRawData(event),
          };
          this.node.log('SUBGIFT', JSON.stringify(payload, null, '  '));
          if (this.onEventCb) {
            this.onEventCb(payload);
          }
        })
      ),

      this.addSubscription(
        this.listener.onChannelFollow(this.userId, this.userId, (event) => {
          const payload: TwitchEventFollow = {
            eventType: 'follow',
            userId: parseInt(event.userId),
            userName: event.userName,
            userDisplayName: event.userDisplayName,
            rawEvent: getRawData(event),
          };
          this.node.log('FOLLOW', JSON.stringify(payload, null, '  '));
          if (this.onEventCb) {
            this.onEventCb(payload);
          }
        })
      ),

      this.addSubscription(
        this.listener.onChannelCheer(this.userId, (event) => {
          const payload: TwitchEventBits = {
            eventType: 'bits',
            userId: parseInt(event.userId ?? '-1'),
            userName: event.userName ?? 'anonymous',
            userDisplayName: event.userDisplayName ?? 'Anonymous',
            amount: event.bits,
            rawEvent: getRawData(event),
          };
          this.node.log(`BITS ${JSON.stringify(payload, null, '  ')}`);
          if (this.onEventCb) {
            this.onEventCb(payload);
          }
        })
      ),
    ].filter(p => !!p));

    const autogen0ArgPromises = Promise.all(subscriptionFns0Arg.map(async (fname: string) => {
      if (!this.userId) {
        return null;
      }
      const fn: (user: UserIdResolvable, handler: (event: DataObject<unknown>) => void) => EventSubSubscription = this.listener[fname];
      const eventName = renameEventFromFnName(fname);
      try {
        return await this.addSubscription(fn.bind(this.listener)(this.userId, createEvent(eventName)));
      }
      catch (e) {
        console.error(e);
      }
    }).filter(p => !!p));

    const autogen1ArgPromises = Promise.all(subscriptionFns1Arg.map(async (fname: string) => {
      if (!this.userId) {
        return null;
      }
      const fn: (user: UserIdResolvable, other: UserIdResolvable, handler: (event: DataObject<unknown>) => void) => EventSubSubscription = this.listener[fname];
      const eventName = renameEventFromFnName(fname);
      try {
        return await this.addSubscription(fn.bind(this.listener)(this.userId, this.userId, createEvent(eventName)));
      }
      catch (e) {
        console.error(e);
      }
    }).filter(p => !!p));

    this.listener.start();
    await promises;
    await autogen0ArgPromises;
    await autogen1ArgPromises;
  }

  async addSubscription(subscription: EventSubSubscription): Promise<void> {
    if (!subscription) {
      this.node.log('No subscription');
      return;
    }
    this.node.log(`addSubscription: ${subscription.id}`);
    return new Promise<void>((resolve, reject) => {
      const updateStatus = (err: Error | null) => {
        if (err) {
          reject(err);
        }
        else {
          resolve();
        }
      };
      this.subscriptions.push({
        subscription: subscription,
        updateStatus: updateStatus,
      });
    });
  }

  async stop() {
    try {
      this.node.log('Stopping TwitchEventsub...');
      const tokenInfo = await this.authProvider.getAccessTokenForUser(this.userId ?? '');
      await Promise.all(this.subscriptions.map(subscription => {
        subscription.subscription.stop();
        return this.deleteSubscription(tokenInfo?.accessToken, subscription.subscription._twitchId);
      }));
      this.subscriptions = [];
      this.listener?.stop();
    }
    catch (e) {
      console.error('Failed to gracefully shutdown', e);
    }
  }

  private async deleteSubscription(accessToken: string | undefined, subscriptionId: string | undefined) {
    //console.log('delete', subscriptionId);
    if (!accessToken || !subscriptionId) {
      return;
    }
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${accessToken}`);
    myHeaders.append("Client-Id", this.clientId ?? '');

    await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscriptionId}`, {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      signal: AbortSignal.timeout(1000),
    })
    .then(response => response.text())
    .catch(error => { console.log('error', error); return true; });
    //console.log('deleted', subscriptionId);
  }
}

export { TwitchEventsub };
