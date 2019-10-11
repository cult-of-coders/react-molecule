import MoleculeContext from "./MoleculeContext";
import { useContext } from "react";
import MoleculeModel from "./Molecule";

export function useMolecule(): MoleculeModel {
  return useContext(MoleculeContext);
}

export function useStore() {
  const molecule = useMolecule();

  if (!molecule.store) {
    throw new Error(`no-store-found`);
  }

  return molecule.store;
}

export function useAgentStore(agentName) {
  const agent = useAgent(agentName);

  if (!agent.store) {
    throw new Error(`no-store-found for ${agentName}`);
  }

  return agent.store;
}

export function useEmitter() {
  return useMolecule().emitter;
}

export function useRegistry() {
  return useMolecule().registry;
}

export function useConfig() {
  return useMolecule().config;
}

export function useAgent(name) {
  const molecule = useMolecule();

  return molecule.agents[name];
}

export function useAgentConfig(agentName) {
  const agent = useAgent(agentName);

  return agent.config;
}
