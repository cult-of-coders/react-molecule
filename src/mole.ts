import * as React from 'react';
import Molecule from './MoleculeWrap';
import { MoleculeOptions } from './defs';

function mole(
  optionsResolver: (props: any) => MoleculeOptions | MoleculeOptions
) {
  return function(Component) {
    return function(props) {
      let options;
      if (typeof optionsResolver === 'function') {
        options = optionsResolver(props);
      } else {
        options = {};
      }

      return React.createElement(Molecule, {
        ...options,
        children: React.createElement(Component, props),
      });
    };
  };
}

export default mole;
