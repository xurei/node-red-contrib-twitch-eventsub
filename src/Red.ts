// Simple Node-RED type to avoid using any

import {AbstractNode} from '/@/AbstractNode';

export type Red = {
  nodes: {
    eachNode: (node: unknown) => void;
    createNode: (node: AbstractNode, config: unknown) => void;
    registerType: (node_name: string, node: unknown) => void;
  }
};
