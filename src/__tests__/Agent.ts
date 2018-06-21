import Molecule from '../Molecule';
import Agent from '../Agent';
import { describe, it } from 'mocha';
import { assert } from 'chai';

describe('Agent', () => {
  class MyAgent extends Agent {
    whoami() {
      return this.config.iam || 'coder';
    }
  }

  it('Should work directly', () => {
    const agent = new MyAgent({
      molecule: {} as Molecule,
    });

    assert.equal('coder', agent.whoami());
  });

  it('Should work with factory', () => {
    const factory = MyAgent.factory({
      iam: 'code',
    });

    const agent = factory({} as Molecule);

    assert.equal('code', agent.whoami());
  });

  it('Should properly get the molecule', () => {
    const factory = MyAgent.factory({
      iam: 'code',
    });

    const agent = factory({
      name: 'dummy',
    } as Molecule);

    assert.equal('dummy', agent.molecule.name);
  });
});
