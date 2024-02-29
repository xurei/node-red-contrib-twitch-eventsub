import {RefreshingAuthProvider} from '@twurple/auth';
import {ApiClient} from '@twurple/api';
import {EventSubWsListener} from '@twurple/eventsub-ws';

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

class TwitchEventsub {
  userId?: number | null;
  authProvider: RefreshingAuthProvider;
  apiClient!: ApiClient;
  listener!: EventSubWsListener;

  onEventCb?: (event: TwitchEvent) => void;

  onAuthError?: () => void;

  constructor(userId: number, clientId: string, clientSecret: string) {
    console.log('NEW TwitchEventsub', clientId, userId);
    this.userId = userId;
    this.authProvider = new RefreshingAuthProvider({
      clientId: clientId,
      clientSecret: clientSecret,
    });
  }

  async init(refreshToken: string) {
    //@ts-ignore
    await this.authProvider.addUserForToken({
      accessToken: '',
      refreshToken: refreshToken,
    });

    this.apiClient = new ApiClient({ authProvider: this.authProvider });
    this.listener = new EventSubWsListener({ apiClient: this.apiClient });

    if (!this.userId) {
      return;
    }

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
      console.log('REDEEM', JSON.stringify(payload, null, '  '));
      if (this.onEventCb) {
        this.onEventCb(payload);
      }
    });

    this.listener.onChannelRaidTo(this.userId, (event) => {
      const payload: TwitchEventRaid = {
        eventType: 'raid',
        userId: parseInt(event.raidingBroadcasterId),
        userName: event.raidingBroadcasterName,
        userDisplayName: event.raidedBroadcasterDisplayName,
        viewers: event.viewers,
      };
      console.log('RAID', JSON.stringify(payload, null, '  '));
      if (this.onEventCb) {
        this.onEventCb(payload);
      }
    });

    this.listener.onChannelSubscription(this.userId, (event) => {
      const payload: TwitchEventsubSubscribe = {
        eventType: 'subscribe',
        userId: parseInt(event.userId),
        userName: event.userName,
        userDisplayName: event.userDisplayName,
        tier: parseInt(event.tier),
      };
      console.log('SUB', JSON.stringify(payload, null, '  '));
      if (this.onEventCb && !event.isGift) {
        this.onEventCb(payload);
      }
    });

    this.listener.onChannelSubscriptionGift(this.userId, (event) => {
      const payload: TwitchEventSubGift = {
        eventType: 'subscribeGift',
        userId: parseInt(event.gifterId),
        userName: event.gifterName,
        userDisplayName: event.gifterDisplayName,
        tier: parseInt(event.tier),
        amount: event.amount,
      };
      console.log('SUBGIFT', JSON.stringify(payload, null, '  '));
      if (this.onEventCb) {
        this.onEventCb(payload);
      }
    });

    this.listener.onChannelFollow(this.userId, this.userId, (event) => {
      const payload: TwitchEventFollow = {
        eventType: 'follow',
        userId: parseInt(event.userId),
        userName: event.userName,
        userDisplayName: event.userDisplayName,
      };
      console.log('FOLLOW', JSON.stringify(payload, null, '  '));
      if (this.onEventCb) {
        this.onEventCb(payload);
      }
    });

    this.listener.onChannelCheer(this.userId, (event) => {
      const payload: TwitchEventBits = {
        eventType: 'bits',
        userId: parseInt(event.userId ?? '-1'),
        userName: event.userName ?? 'anonymous',
        userDisplayName: event.userDisplayName ?? 'Anonymous',
        amount: event.bits,
      };
      console.log('BITS', JSON.stringify(payload, null, '  '));
      if (this.onEventCb) {
        this.onEventCb(payload);
      }
    });

    this.listener.onSubscriptionCreateFailure((event) => {
      if (this.onAuthError) {
        console.log('ON AUTH ERROR');
        this.onAuthError();
      }
    });
  }

  start() {
    this.listener.start();
  }
}

export { TwitchEventsub };
