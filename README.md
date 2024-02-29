# node-red-contrib-twitch-eventsub
Connects to Twitch Eventsub with the help of [Twurple](https://www.npmjs.com/package/@twurple/api).

### Features
- Listening to events from Twitch : follow, sub, subgift, cheer, reward redeem, and raid.

### Setup
1. Add the "Twitch Eventsub" node in your flow, create the configuration with the fields.

2. Get your twitch user ID and put the value in the `Twitch Broadcaster ID` field.  
   - You can get your twitch ID from your twitch name via this page : https://www.streamweasels.com/support/convert-twitch-username-to-user-id

3. If you don't have one yet, create a twitch application here: https://dev.twitch.tv/console.  
   - Get the Client ID and the Secret Client and put these values in `Twitch Client ID` and `Twitch Client Secret` fields.

4. Generate a refresh token using https://twitchtokengenerator.com/ or any other tool. Put it in the `Twitch Refresh Token` field. 
   - See also the [Authorization code grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#authorization-code-grant-flow) from Twitch documentation.

5. Save, deploy. Try and redeem a reward of the channel you just configured. You should get a message for each redeem you make.
   - You can also follow, subscribe, cheer the channel, and you should see the matching message being sent by the Eventsub node.

Happy Streaming !
