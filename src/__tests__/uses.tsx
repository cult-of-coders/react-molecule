import "./enzyme.config";
import {
  useMolecule,
  useAgent,
  useAgentConfig,
  useAgentStore,
  useStore,
  useRegistry,
  useEmitter,
  useConfig
} from "../uses";
import molecule from "../mole";
import Molecule from "../MoleculeWrap";
import MoleculeModel from "../Molecule";
import Agent from "../Agent";
import { describe, it } from "mocha";
import { assert } from "chai";
import * as React from "react";
import { shallow } from "enzyme";
import EventEmitter from "../EventEmitter";
import { ComponentRegistry } from "../ComponentRegistry";

describe("uses", () => {
  it("useMolecule & others", () => {
    const CONFIG = { number: 2500 };
    const checkConfig = obj => {
      assert.isObject(obj);
      assert.equal(2500, obj.number);
    };

    function HelloDumb() {
      const molecule = useMolecule();
      const moleculeConfig = useConfig();
      const emitter = useEmitter();
      const store = useStore();
      const agent = useAgent("loader");
      const registry = useRegistry();
      const agentConfig = useAgentConfig("loader");

      // const agentStore = useAgentStore("loader");
      // checkConfig(agentStore);

      assert.isTrue(molecule instanceof MoleculeModel);
      assert.isTrue(agent instanceof Agent);
      assert.isTrue(registry instanceof ComponentRegistry);

      checkConfig(moleculeConfig);
      checkConfig(store);
      checkConfig(agentConfig);
      assert.isTrue(emitter instanceof EventEmitter);

      return <div>Yes:Woop</div>;
    }

    const Dummy = molecule(() => {
      return {
        config: CONFIG,
        store: CONFIG,
        agents: {
          loader: Agent.factory(CONFIG)
        }
      };
    })(HelloDumb);

    const wrapper = shallow(<Dummy value={123} />);
    assert.include(wrapper.html(), "Yes:Woop");
  });
});
