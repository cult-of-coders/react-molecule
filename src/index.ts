import MoleculeContext from "./MoleculeContext";
import Registry, { createRegistry } from "./ComponentRegistry";
import Molecule from "./MoleculeWrap";
import MoleculeModel from "./Molecule";
import { withMolecule, withAgent, WithAgent, WithMolecule } from "./withs";
import mole from "./mole";
import Agent from "./Agent";
import * as Types from "./defs";
import Emitter from "./Emitter";
import {
  useStore,
  useMolecule,
  useAgent,
  useRegistry,
  useConfig,
  useAgentConfig
} from "./uses";

const molecule = mole;

export {
  mole, // deprecated
  molecule,
  Molecule,
  MoleculeContext,
  Registry,
  createRegistry,
  Agent,
  Emitter,
  withMolecule,
  withAgent,
  WithAgent,
  WithMolecule,
  // We export this one so someone can override it
  MoleculeModel,
  Types,
  useStore,
  useMolecule,
  useAgent,
  useRegistry,
  useConfig,
  useAgentConfig
};
