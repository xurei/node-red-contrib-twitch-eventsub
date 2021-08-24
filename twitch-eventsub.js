module.exports = function(RED) {
  function EventSubNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    
    const id = Math.floor(Math.random()*1000000);
  
    this.twitchConfig = RED.nodes.getNode(config.config);
  
    if (this.twitchConfig) {
      // On Start
      this.twitchConfig.addNode(id, node);
  
      // On Delete
      this.on('close', function() {
        this.twitchConfig.removeNode(id);
      });
    }
    else {
      // No config node configured
      // TODO show error message if no config found
    }
    
    node.triggerTwitchEvent = function (event) {
      node.send({
        payload: event
      });
    };
  }
  RED.nodes.registerType("twitch-eventsub", EventSubNode);
}
