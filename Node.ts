// From https://github.com/bernardobelchior/node-red-contrib-typescript-node/blob/master/src/Node.ts

import type { Node as NRNode, NodeProperties, Red } from 'node-red';

export abstract class Node {
  red: Red;

  protected constructor(RED: Red) {
    this.red = RED;
  }

  public createNode(config: NodeProperties): void {
    console.log('createNode');
    this.red.nodes.createNode(this, config);
  }

  static registerType(RED: Red, type: string, opts?: any) {
    RED.nodes.registerType(
      type,
      (this as any).prototype.constructor as any,
      opts
    );
  }
}
