import './enzyme.config';
import { withMolecule, WithMolecule, withAgent, WithAgent } from '../withs';
import mole from '../mole';
import Registry, {
  ComponentRegistry,
  createRegistry,
} from './../ComponentRegistry';
import Molecule from '../MoleculeWrap';
import MoleculeModel from '../Molecule';
import Agent from '../Agent';
import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as React from 'react';
import { shallow } from 'enzyme';

describe('withs', () => {
  it('mole', () => {
    function HelloDumb({ molecule, value }) {
      return (
        <div>
          {molecule instanceof MoleculeModel && value == 123
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

    const wrapper = shallow(<Dummy value={123} />);
    assert.include(wrapper.html(), 'Yes:Woop');
  });

  it('withMolecule', () => {
    function HelloDumb({ molecule, value }) {
      return (
        <div>
          {value == 123 && molecule instanceof MoleculeModel ? 'Yes' : 'No'}
        </div>
      );
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

  it('Molecule should be able to have access to the parent molecule', () => {
    const Hello: React.SFC<any> = ({ molecule }) => {
      const isOk =
        molecule.name === 'child' &&
        molecule.parent &&
        molecule.parent.name === 'parent';

      return <div>{isOk ? 'Yes' : 'No'}</div>;
    };

    const Wrapper = () => (
      <Molecule name="parent">
        <Molecule name="child">
          <Hello />
        </Molecule>
      </Molecule>
    );

    const wrapper = shallow(<Wrapper />);
    assert.include(wrapper.html(), 'Yes');
  });

  it('Molecule & parents -- should dispatch event to parent molecule', done => {
    const Hello: React.SFC<any> = ({ molecule }) => {
      molecule.emit('propagate');
      return null;
    };

    function agent(molecule) {
      return {
        prepare() {},
        validate() {},
        clean() {},
        init() {
          molecule.on('propagate', () => done());
        },
      };
    }

    const Wrapper = () => (
      <Molecule name="parent" agents={{ agent }}>
        <Molecule name="child">
          <Hello />
        </Molecule>
      </Molecule>
    );

    const wrapper = shallow(<Wrapper />);
    wrapper.html();
  });

  it('Should work with enveloping the component', () => {
    const Item = ({ value }) => (value ? 'Yes' : 'No');
    Registry.blend({
      Item,
    });

    const EvenelopeItem = (props, Item) => {
      return <Item value={true} />;
    };

    Registry.blend({
      Item: EvenelopeItem,
    });

    const Wrapper = () => (
      <Molecule>
        {molecule => {
          const { Item } = molecule.registry;

          return <Item value={false} />;
        }}
      </Molecule>
    );

    const wrapper = shallow(<Wrapper />);
    assert.include(wrapper.html(), 'Yes');
  });
});
