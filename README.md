# node-red-contrib-twitch-eventsub
Connects to Twitch Eventsub with the help of [Twurple](https://www.npmjs.com/package/@twurple/api).

Listens to chat messages, follows, subs, subgifts, cheers, reward redeems, raids, and more !

### Features
- Provides a node that will listen to **all** the Websocket events that Twitch provides

### Setup
1. Add the "Twitch Eventsub" node in your flow, create the configuration with the fields.

2. Get your twitch user ID and put the value in the `Twitch Broadcaster ID` field.  
   - You can get your twitch ID from your twitch name via this page : https://www.streamweasels.com/support/convert-twitch-username-to-user-id

3. If you don't have one yet, create a twitch application here: https://dev.twitch.tv/console.  
   - Get the Client ID and the Secret Client and put these values in `Twitch Client ID` and `Twitch Client Secret` fields.

4. Generate a refresh token using https://twitchtokengenerator.com/ or any other tool. Put it in the `Twitch Refresh Token` field. 
   - See also the [Authorization code grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#authorization-code-grant-flow) from Twitch documentation.
   - You need all these scopes to subscribe to all the available events:
     - bits:read
     - channel:moderate
     - channel:read:ads
     - channel:read:charity
     - channel:read:goals
     - channel:read:guest_star
     - channel:read:hype_train
     - channel:read:polls
     - channel:read:predictions
     - channel:read:redemptions
     - channel:read:subscriptions
     - channel:read:vips
     - chat:read
     - moderation:read
     - moderator:manage:blocked_terms
     - moderator:manage:chat_messages
     - moderator:manage:unban_requests
     - moderator:read:automod_settings
     - moderator:read:blocked_terms
     - moderator:read:chat_settings
     - moderator:read:followers
     - moderator:read:guest_star
     - moderator:read:shield_mode
     - moderator:read:shoutouts
     - moderator:read:suspicious_users 
     - moderator:read:unban_requests
     - user:read:chat
       

5. Save, deploy. Try and redeem a reward of the channel you just configured. You should get a message for each redeem you make.
   - You can also follow, subscribe, cheer the channel, and you should see the matching message being sent by the Eventsub node.

Happy Streaming !
