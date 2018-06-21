import { ComponentMap, ComponentRegistryBlendOptions } from './defs';
import React from 'react';

export class ComponentRegistry {
  // Index to allow const { X, Y } = registry
  [index: string]: any;
  public store;
  public parent: ComponentRegistry;

  constructor(store = {}, parent = null) {
    this.store = store;
    this.parent = parent;
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

  createElement(name, ...args) {
    const Component = this.get(name);

    if (!Component) {
      throw new Error(`Sorry, but there is no component: "${name}" registered`);
    }

    return React.createElement(Component, ...args);
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

    Object.assign(this.store, store);
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
