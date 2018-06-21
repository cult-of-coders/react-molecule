import { IAgent } from './defs';
import EventEmitter from './EventEmitter';
import Molecule from './Molecule';

export type AgentConfig = {
  molecule: Molecule;
  [key: string]: any;
};

class Agent implements IAgent {
  config: any = {};
  store?: any;
  emitter: EventEmitter;
  preventInit: boolean = false;

  constructor(config?: AgentConfig) {
    this.config = config;

    let configWithoutMolecule = Object.assign({}, config);
    delete configWithoutMolecule.molecule;

    this.validate(configWithoutMolecule);

    this.emitter = new EventEmitter({
      context: config.name,
      debug: config.debug,
    });
  }

  get molecule() {
    return this.config.molecule;
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

  /**
   * @return IAgent
   * @param name string
   */
  public getAgent(name): IAgent {
    return this.molecule.getAgent(name);
  }

  prepare(): void {}
  init(): void {}
  clean(): void {}
  validate(config: any): void {}

  isDebug() {
    return this.config.debug || this.molecule.debug;
  }

  static factory(config?: object): ((molecule: Molecule) => any) {
    const def = this;
    return function(molecule) {
      return new def({ ...config, molecule });
    };
  }
}

export default Agent;
