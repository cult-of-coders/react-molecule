import { AgentConfig } from './../../../../../.meteor/local/build/programs/server/npm/node_modules/react-molecule/src/Agent';
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

  it('Should be able to get the agent from the molecule through getAgent()', () => {
    const molecule = new Molecule({
      agents: {
        first: MyAgent.factory(),
        second: MyAgent.factory(),
      },
    });

    const second = molecule.getAgent('first').getAgent('second');

    assert.isObject(second);
  });

  it('Event emissions', done => {
    const agent = new MyAgent({
      molecule: {} as Molecule,
    });

    const fn = () => done('Error');

    agent.on('do-not-throw', fn);
    agent.off('do-not-throw', fn);

    agent.on('done', () => done());

    agent.emit('do-not-throw');
    agent.emit('done');
  });
});
