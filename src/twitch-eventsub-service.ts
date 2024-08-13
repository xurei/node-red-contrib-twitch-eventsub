import {RefreshingAuthProvider} from '@twurple/auth';
import {ApiClient} from '@twurple/api';
import {EventSubWsListener} from '@twurple/eventsub-ws';
import type {EventSubSubscription} from '@twurple/eventsub-base/lib/subscriptions/EventSubSubscription';
import {AbstractNode} from '/@/AbstractNode';

type TwitchEvent = {
  eventType: string;
  userId: number;
  userName: string;
  userDisplayName: string;
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

type EventSubSubscriptionWithStatus = {
  subscription: EventSubSubscription;
  //statusPromise: Promise<void>;
  updateStatus: (error: Error | null) => void;
};

class TwitchEventsub {
  clientId?: string | null;
  userId?: number | null;
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
    //@ts-ignore
    await this.authProvider.addUserForToken({
      accessToken: '',
      refreshToken: refreshToken,
    });

    this.apiClient = new ApiClient({authProvider: this.authProvider});
    this.listener = new EventSubWsListener({apiClient: this.apiClient});

    if (!this.userId) {
      return;
    }

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

    const promises = Promise.all([
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
          };
          this.node.log(`BITS ${JSON.stringify(payload, null, '  ')}`);
          if (this.onEventCb) {
            this.onEventCb(payload);
          }
        })
      ),
    ].filter(p => !!p));
    this.listener.start();
    await promises;
  }

  async addSubscription(subscription: EventSubSubscription): Promise<void> {
    if (!subscription) {
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
      const tokenInfo = await this.authProvider.getAccessTokenForUser(this.userId ?? '');
      await Promise.all(this.subscriptions.map(subscription => {
        subscription.subscription.stop();
        return this.deleteSubscription(tokenInfo?.accessToken, subscription.subscription._twitchId);
      }));
      this.subscriptions = [];
      this.listener.stop();
    }
    catch (e) {
      console.error('Failed to gracefully shutdown', e);
    }
  }

  private deleteSubscription(accessToken: string | undefined, subscriptionId: string | undefined) {
    if (!accessToken || !subscriptionId) {
      return;
    }
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${accessToken}`);
    myHeaders.append("Client-Id", this.clientId ?? '');

    return fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscriptionId}`, {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      signal: AbortSignal.timeout(1000),
    })
    .then(response => response.text())
    .catch(error => { console.log('error', error); return true; });
  }
}

export { TwitchEventsub };
