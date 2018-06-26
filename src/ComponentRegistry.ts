import { ComponentMap, ComponentRegistryBlendOptions } from './defs';
import React from 'react';

export class ComponentRegistry {
  // Index to allow const { X, Y } = registry
  [index: string]: any;
  public store = {};
  public parent: ComponentRegistry;

  constructor(store = {}, parent = null) {
    this.parent = parent;

    this.updateStore(store);
  }

  get(componentName): any | ComponentMap {
    if (Array.isArray(componentName)) {
      const componentNames = componentName;
      let map = {};
      componentNames.forEach(componentName => {
        map[componentName] = this.getSingle(componentName);
      });

      return map;
    }

    return this.getSingle(componentName);
  }

  getSingle(componentName) {
    if (this.store[componentName]) {
      return this.store[componentName];
    }

    let component;
    if (this.parent) {
      component = this.parent.getSingle(componentName);
    }

    return component;
  }

  blend(
    registry: ComponentRegistry | ComponentMap,
    options?: ComponentRegistryBlendOptions
  ) {
    options = options || {};

    let store;
    if (registry instanceof ComponentRegistry) {
      store = registry.store;
    } else {
      store = Object.assign({}, registry);
    }

    if (options.prefix) {
      let newStore = {};
      for (let COMPONENT in store) {
        newStore[options.prefix + COMPONENT] = store[COMPONENT];
      }
      store = newStore;
    }

    if (options.throwOnCollisions) {
      for (let COMPONENT in store) {
        if (this.store[COMPONENT]) {
          throw new Error(
            `Sorry, we couldn't blend because there was a collision on: ${COMPONENT} component`
          );
        }
      }
    }

    this.updateStore(store);
  }

  private updateStore(store = {}) {
    let newStore = {};
    for (let COMPONENT in store) {
      if (
        typeof store[COMPONENT] === 'function' &&
        store[COMPONENT].length === 2
      ) {
        let oldReference = this.getSingle(COMPONENT);

        newStore[COMPONENT] = function(props) {
          return store[COMPONENT].call(null, props, oldReference);
        };
      } else {
        newStore[COMPONENT] = store[COMPONENT];
      }
    }

    Object.assign(this.store, newStore);
  }
}

/**
 * This factory method allows us to use: const { Tags, Posts } = Registry;
 * @param args
 */
export function createRegistry(...args): ComponentRegistry {
  const registry = new ComponentRegistry(...args);

  return new Proxy(registry, {
    get(obj: ComponentRegistry, prop: string) {
      if (prop in obj) {
        return obj[prop];
      } else {
        return obj.getSingle(prop);
      }
    },
  });
}

export default createRegistry();
