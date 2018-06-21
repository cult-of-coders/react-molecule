import './enzyme.config';
import { withMolecule, WithMolecule, withAgent, WithAgent } from '../withs';
import mole from '../mole';
import { ComponentRegistry, createRegistry } from './../ComponentRegistry';
import Molecule from '../MoleculeWrap';
import MoleculeModel from '../Molecule';
import Agent from '../Agent';
import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as React from 'react';
import { shallow } from 'enzyme';

describe('withs', () => {
  it('mole', () => {
    function HelloDumb({ molecule }) {
      return (
        <div>
          {molecule instanceof MoleculeModel
            ? `Yes:${molecule.config.text}`
            : 'No'}
        </div>
      );
    }

    const Dummy = mole(() => {
      return {
        config: {
          text: 'Woop',
        },
      };
    })(HelloDumb);

    const wrapper = shallow(<Dummy />);
    assert.include(wrapper.html(), 'Yes:Woop');
  });

  it('withMolecule', () => {
    function HelloDumb({ molecule }) {
      return <div>{molecule instanceof MoleculeModel ? 'Yes' : 'No'}</div>;
    }

    const Hello = withMolecule(HelloDumb);

    const Dummy = () => (
      <Molecule>
        <div>
          <Hello value={123} />
        </div>
      </Molecule>
    );

    const wrapper = shallow(<Dummy />);
    assert.include(wrapper.html(), 'Yes');
  });

  it('<WithMolecule />', () => {
    function HelloDumb({ molecule }) {
      return <div>{molecule instanceof MoleculeModel ? 'Yes' : 'No'}</div>;
    }

    const Dummy = () => (
      <Molecule>
        <div>
          <WithMolecule>
            {molecule => <HelloDumb molecule={molecule} />}
          </WithMolecule>
        </div>
      </Molecule>
    );

    const wrapper = shallow(<Dummy />);
    assert.include(wrapper.html(), 'Yes');
  });

  it('withAgent', () => {
    function HelloDumb({ agent }) {
      return <div>{agent instanceof Agent ? 'Yes' : 'No'}</div>;
    }

    const Hello = withAgent('dummy')(HelloDumb);
    class MyAgent extends Agent {}

    const Dummy = () => (
      <Molecule agents={{ dummy: MyAgent.factory() }}>
        <Hello />
      </Molecule>
    );

    const wrapper = shallow(<Dummy />);
    assert.include(wrapper.html(), 'Yes');
  });

  it('<WithAgent />', () => {
    function HelloDumb({ agent }) {
      return <div>{agent instanceof Agent ? 'Yes' : 'No'}</div>;
    }

    class MyAgent extends Agent {}

    const Dummy = () => (
      <Molecule agents={{ dummy: MyAgent.factory() }}>
        <WithAgent agent="dummy">
          {({ agent, molecule }) => {
            return <HelloDumb agent={agent} />;
          }}
        </WithAgent>
      </Molecule>
    );

    const wrapper = shallow(<Dummy />);
    assert.include(wrapper.html(), 'Yes');
  });
});
