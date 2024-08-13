module.exports = function(RED) {
  function EventSubNode(config) {
    //@ts-expect-error any
    const node = this as any;
    RED.nodes.createNode(node, config);

    const id = Math.floor(Math.random()*1000000);

    node.twitchConfig = RED.nodes.getNode(config.config);

    if (node.twitchConfig) {
      // On Start
      node.twitchConfig.addNode(id, node);

      // On Delete
      node.on('close', (removed: boolean, done: () => void) => {
        if (removed) {
          node.twitchConfig.removeNode(id, done);
        }
        else {
          done();
        }
      });
    }
    else {
      // No config node configured
      // TODO show error message if no config found
    }

    node.triggerTwitchEvent = function(event) {
      node.send({
        payload: event
      });
    };
  }

  EventSubNode.icon = 'twitch-icon.png';

  RED.nodes.registerType("twitch-eventsub", EventSubNode);
}
