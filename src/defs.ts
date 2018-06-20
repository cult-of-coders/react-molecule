import EventEmitter from './EventEmitter';
import { Molecule, Agent } from '.';

export type AgentDefinitionMap = {
  [key: string]: (molecule) => Agent;
};

export type ComponentMap = {
  [component: string]: any;
};

export type MoleculeOptions = {
  config?: any;
  registry?: ComponentMap;
  store?: any;
  agents?: AgentDefinitionMap;
  name?: string;
  debug?: boolean;
};

export interface IAgent {
  emit(key: string, value: any): void;
  on(event: string, handler: () => void): void;
  off(event: string, handler: () => void): void;
  molecule: Molecule;
  emitter: EventEmitter;
  preventInit: boolean;
  init(): void;
  prepare(): void;
  clean(): void;
}

export type ComponentRegistryBlendOptions = {
  prefix?: string;
  throwOnCollisions?: boolean;
};
