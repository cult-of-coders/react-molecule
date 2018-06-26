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

  it('Should work be able to blend properly with object map', () => {
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

  it('Should work be able to blend properly with object map', () => {
    const dummy = () => null;

    const registry = createRegistry({
      Dummy1: dummy,
    });

    registry.blend(
      {
        Dummy2: dummy,
      },
      {
        prefix: 'John',
      }
    );

    const { JohnDummy2 } = registry;
    ``;
    assert.equal(dummy, JohnDummy2);
  });

  it('Should work be able to blend with throwOnCollisions option', done => {
    const dummy = () => null;

    const registry = createRegistry({
      Dummy1: dummy,
    });

    try {
      registry.blend(
        {
          Dummy1: dummy,
        },
        {
          throwOnCollisions: true,
        }
      );
    } catch (e) {
      done();
    }
  });

  it('Should work be able to blend properly with another registry', () => {
    const dummy = () => null;

    const registry = createRegistry({
      Dummy1: dummy,
    });

    const blendable = createRegistry({
      Dummy2: dummy,
    });

    registry.blend(blendable);

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
