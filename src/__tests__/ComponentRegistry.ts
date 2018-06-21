import { ComponentRegistry, createRegistry } from './../ComponentRegistry';
import Agent from '../Agent';
import { describe, it } from 'mocha';
import { assert } from 'chai';

describe('ComponentRegistry', () => {
  it('createRegistry()', () => {
    const registry = createRegistry();

    assert.isTrue(registry instanceof ComponentRegistry);
  });

  it('Should work be able to store and fetch', () => {
    const dummy = () => null;

    const registry = createRegistry({
      Dummy1: dummy,
    });

    const { Dummy1 } = registry;

    assert.equal(dummy, Dummy1);
  });

  it('Should work be able to blend properly', () => {
    const dummy = () => null;

    const registry = createRegistry({
      Dummy1: dummy,
    });

    registry.blend({
      Dummy2: dummy,
    });

    const { Dummy2 } = registry;

    assert.equal(dummy, Dummy2);
  });

  it('Should work with parents on multiple levels', () => {
    const dummy = () => null;

    const parent1 = createRegistry({
      Dummy1: dummy,
    });

    const parent2 = createRegistry({}, parent1);

    const child = createRegistry(
      {
        Dummy2: dummy,
      },
      parent2
    );

    const { Dummy2 } = child;

    assert.equal(dummy, Dummy2);
  });

  it('Should work with get properly', () => {
    const dummy = () => null;

    const parent = createRegistry({
      Dummy1: dummy,
    });

    assert.equal(dummy, parent.get('Dummy1'));

    const { Dummy1 } = parent.get(['Dummy1']);
    assert.equal(dummy, Dummy1);
  });
});
