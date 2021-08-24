## 🚧 DISCLAIMER : This is still a WORK IN PROGRESS 🚧

Connect to the Twitch EventSub API using ngrok.

This palette brings a Twitch EventSub node in Node-RED

### Features
- Automatic generation of the access token
- Listening to events from Twitch (e.g. Follows, Reward requests, Bans, ...)
  The complete list of subscription types can be found here : https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types

### Setup
#### Twitch app
1. Create a twitch application here: https://dev.twitch.tv/console.
   - Get the Client ID and the Secret Client and put these values in `Twitch Client ID` and `Twitch Client Secret` fields.
   - On the app you must also configure an OAuth redirect URI.
   - Choose the port you want to use in the `Server Port` field, then configure this URL:\
   `http://localhost:[CHOSEN_PORT]/oauth`\
   *(make sure the port is the same as the one configured on the var `Server Port`)*

2. **🚧 This is currently hardcoded. Subscribed events are : `channel.follow, channel.subscribe, channel.subscription.message, channel.cheer, stream.online, stream.offline, channel.raid, channel.channel_points_custom_reward_redemption.add`**\
   **You can skip this step for now.**\
   Define the events you want to subscribe to in the `Subscribe to events` field.\
   See full events list here :\
   https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types

4. Set your twitch user ID in the `Twitch Broadcaster ID` field.\
   You can get your twitch ID from your twitch name via this page : https://www.streamweasels.com/support/convert-twitch-username-to-user-id

5. Define a `Twitch EventSub Secret` key. Just write anything you want as a value. Anything genitally related will do 😏.

#### NGrok
Create an account on https://ngrok.com and get an auth token. Works with a free account.\
Put the token in the `NGROK token` config field.
