import {StaticAuthProvider} from '@twurple/auth';
import {ApiClient} from '@twurple/api';
import {EventSubWsListener} from '@twurple/eventsub-ws';

type TwitchEvent = {
  eventType: string;
  userId: string;
  userName: string;
};
type TwitchEventRedeem = TwitchEvent & {
  rewardId: string;
  rewardName: string;
  rewardMessage: string;
};
type TwitchEventRaid = TwitchEvent & {
  viewers: number;
};
type TwitchEventsubService = TwitchEvent & {
  tier: string;
};
type TwitchEventSubGift = TwitchEvent & {
  tier: string;
  amount: number;
};
type TwitchEventBits = TwitchEvent & {
  amount: number;
};

class TwitchEventsub {
  accessToken = '';
  apiClient!: ApiClient;
  userId?: number | null;
  clientId: string;
  listener!: EventSubWsListener;

  onEventCb?: (event: TwitchEvent) => void;

  // onFollowCb?: (event: TwitchEvent) => void;
  // onSubscriptionCb?: (event: TwitchEventsubService) => void;
  // onSubscriptionGiftCb?: (event: TwitchEventSubGift) => void;
  // onRaidCb?: (event: TwitchEventRaid) => void;
  // onBitsCb?: (event: TwitchEventBits) => void;
  // onRedeemCb?: (event: TwitchEventRedeem) => void;
  onAuthError?: () => void;

  constructor(clientId: string, userId: number | null, accessToken: string) {
    console.log('NEW TwitchEventsub', clientId, userId, accessToken);
    this.clientId = clientId;
    this.accessToken = accessToken;
    this.userId = userId;
    const authProvider = new StaticAuthProvider(this.clientId, this.accessToken);
    this.apiClient = new ApiClient({ authProvider });
    this.listener = new EventSubWsListener({ apiClient: this.apiClient });

    if (!userId) {
      return;
    }

    this.listener.onChannelRedemptionAdd(userId, (event) => {
      const payload: TwitchEventRedeem = {
        eventType: 'redeem',
        userId: event.userId,
        userName: event.userName,
        rewardId: event.rewardId,
        rewardName: event.rewardTitle,
        rewardMessage: event.input,
      };
      console.log('REDEEM', JSON.stringify(payload, null, '  '));
      if (this.onEventCb) {
        this.onEventCb(payload);
      }
    });

    this.listener.onChannelRaidTo(userId, (event) => {
      const payload: TwitchEventRaid = {
        eventType: 'raid',
        userId: event.raidingBroadcasterId,
        userName: event.raidingBroadcasterName,
        viewers: event.viewers,
      };
      console.log('RAID', JSON.stringify(payload, null, '  '));
      if (this.onEventCb) {
        this.onEventCb(payload);
      }
    });

    this.listener.onChannelSubscription(userId, (event) => {
      const payload: TwitchEventsubService = {
        eventType: 'subscribe',
        userId: event.userId,
        userName: event.userName,
        tier: event.tier,
      };
      console.log('SUB', JSON.stringify(payload, null, '  '));
      if (this.onEventCb && !event.isGift) {
        this.onEventCb(payload);
      }
    });

    this.listener.onChannelSubscriptionGift(userId, (event) => {
      const payload: TwitchEventSubGift = {
        eventType: 'subscribeGift',
        userId: event.gifterId,
        userName: event.gifterName,
        tier: event.tier,
        amount: event.amount,
      };
      console.log('SUBGIFT', JSON.stringify(payload, null, '  '));
      if (this.onEventCb) {
        this.onEventCb(payload);
      }
    });

    this.listener.onChannelFollow(userId, userId, (event) => {
      const payload = {
        eventType: 'bits',
        userId: event.userId,
        userName: event.userName,
      };
      console.log('FOLLOW', JSON.stringify(payload, null, '  '));
      if (this.onEventCb) {
        this.onEventCb(payload);
      }
    });

    this.listener.onChannelCheer(userId, (event) => {
      const payload: TwitchEventBits = {
        eventType: 'bits',
        userId: event.userId ?? '',
        userName: event.userName ?? '',
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

    // const onlineSubscription = this.listener.onStreamOnline(userId, e => {
    //   console.log(`${e.broadcasterDisplayName} just went live!`);
    // });
    //
    // const offlineSubscription = this.listener.onStreamOffline(userId, e => {
    //   console.log(`${e.broadcasterDisplayName} just went offline`);
    // });
  }

  start() {
    this.listener.start();
  }
}

export { TwitchEventsub };
