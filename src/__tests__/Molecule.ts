import { ComponentRegistry, createRegistry } from './../ComponentRegistry';
import Molecule from '../Molecule';
import Agent from '../Agent';
import { describe, it } from 'mocha';
import { assert } from 'chai';

describe('MoleculeModel', () => {
  it('Should instantiate properly', () => {
    const dummy = () => null;

    const molecule = new Molecule({
      name: 'dummy',
      store: {
        value: 'dummy',
      },
      registry: {
        Dummy1: dummy,
      },
      config: {
        value: 'dummy-config',
      },
    });

    assert.isTrue(molecule.registry instanceof ComponentRegistry);
    assert.equal('dummy', molecule.name);
    assert.equal('dummy', molecule.store.value);
    assert.equal(dummy, molecule.registry.get('Dummy1'));
    assert.equal('dummy-config', molecule.config.value);
  });

  it('Should instantiate and clean agents properly', done => {
    let inInit = false;
    let inValidate = false;
    let inPrepare = false;

    class MyAgent extends Agent {
      validate(config) {
        inValidate = true;
      }
      prepare() {
        if (!inValidate) {
          done('Should have been in-validate first');
        }

        inPrepare = true;
      }
      init() {
        if (!inPrepare) {
          done('Should have been in-prepare first');
        }

        inInit = true;
      }
      clean() {
        assert.isTrue(inValidate);
        assert.isTrue(inInit);
        assert.isTrue(inPrepare);

        done();
      }
    }

    const molecule = new Molecule({
      agents: {
        dummy: MyAgent.factory(),
      },
    });

    molecule.init();
    molecule.clean();
  });

  it('Should get the current agents and throw if not found', done => {
    class MyAgent extends Agent {}

    const molecule = new Molecule({
      agents: {
        dummy: MyAgent.factory(),
      },
    });

    assert.isTrue(molecule.getAgent('dummy') instanceof MyAgent);

    try {
      molecule.getAgent('dummy-not-exists');
    } catch (e) {
      done();
    }
  });

  it('Should work as a tree with children, root and closest', () => {
    const root = new Molecule({
      name: 'i_am_root',
    });

    const parent = new Molecule(
      {
        name: 'i_am_parent',
      },
      root
    );

    const child = new Molecule(
      {
        name: 'i_am_child',
      },
      parent
    );

    assert.isTrue(child.root === root);
    assert.isTrue(root.root === root);
    assert.isTrue(root.children.length === 1);
    assert.isTrue(parent.children.length === 1);
    assert.isTrue(child.children.length === 0);
    assert.isTrue(child.closest('i_am_parent') === parent);
    assert.isTrue(parent.closest('i_am_parent') === parent);
    assert.isTrue(root.closest('i_am_parent') === null);

    const orphan = new Molecule({
      name: 'i_am_orphan',
    });

    assert.isFalse(!!orphan.parent);

    child.clean();
    assert.isTrue(parent.children.length === 0);
  });

  it('Should work with deep event propagation', done => {
    const root = new Molecule({
      name: 'i_am_root',
    });

    const parent = new Molecule(
      {
        name: 'i_am_parent',
      },
      root
    );

    const child = new Molecule(
      {
        name: 'i_am_child',
      },
      parent
    );

    child.on('deep', () => done());

    root.deepmit('deep');
  });
});
