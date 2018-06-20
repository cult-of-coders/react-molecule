import EventEmitter from './EventEmitter';

import { IAgent, MoleculeOptions } from './defs';
import Agent from './Agent';
import MainRegistry, {
  createRegistry,
  ComponentRegistry,
} from './ComponentRegistry';

export default class MoleculeModel {
  name?: string;
  config = {};
  debug = false;
  agents: { [key: string]: Agent } = {};
  emitter: EventEmitter;
  store: any = {};
  registry: ComponentRegistry;

  constructor(value: MoleculeOptions) {
    const { config, agents, store, registry, name, debug } = value;

    this.emitter = new EventEmitter({
      context: name,
      debug,
    });

    this.registry = createRegistry({}, MainRegistry);
    if (value.registry) {
      this.registry.blend(value.registry, {});
    }

    if (value.agents) {
      this.storeAgents(value.agents);
    }

    if (value.name) {
      this.name = value.name;
    }

    if (value.store) {
      this.store = value.store;
    }

    if (config) {
      this.config = config;
    }
  }

  init() {
    // This gives all agent the chance to hook into other agents before they do anything
    for (let agentName in this.agents) {
      const agent = this.agents[agentName];
      agent.prepare();
    }

    for (let agentName in this.agents) {
      const agent = this.agents[agentName];
      if (!agent.preventInit) {
        agent.init();
      }
    }
  }

  clean() {
    this.emitter.removeAllListeners();
    for (let agentName in this.agents) {
      const agent = this.agents[agentName];

      agent.emitter.removeAllListeners();
      agent.clean();
    }
  }

  public on(event: any, handler: any) {
    this.emitter.on(event, handler);
  }

  public off(event: any, handler: any) {
    this.emitter.off(event, handler);
  }

  public emit(event: any, ...args: any[]) {
    this.emitter.emit(event, ...args);
  }

  getAgent(name): Agent {
    const agent = this.agents[name];

    if (!agent) {
      throw new Error(
        `We could not find the agent with name: "${name}" inside this molecule.`
      );
    }

    return agent;
  }

  /**
   * Constructing the agents
   * @param _agents
   */
  private storeAgents(_agents) {
    let agents = {};

    for (let agentName in _agents) {
      agents[agentName] = _agents[agentName](this);
    }

    this.agents = agents;
  }
}
