import MoleculeContext from './MoleculeContext';
import * as React from 'react';
import Molecule from './Molecule';

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export interface WithMoleculeProps {
  molecule: Molecule;
}

export const withMolecule = (WrappedComponent): React.SFC<any> => {
  const WithMoleculeContainer: React.SFC = function(props: any) {
    return (
      <MoleculeContext.Consumer>
        {molecule =>
          React.createElement(WrappedComponent, { ...props, molecule })
        }
      </MoleculeContext.Consumer>
    );
  };

  WithMoleculeContainer.displayName = `WithMolecule(${getDisplayName(
    WrappedComponent
  )})`;

  return WithMoleculeContainer;
};

export const withAgent = (agentName, asName: string = 'agent') => {
  return function(WrappedComponent) {
    const WithAgentContainer: React.SFC = function(props) {
      return React.createElement(
        withMolecule(({ molecule }) => {
          const newProps = Object.assign({}, props, {
            [asName]: molecule.agents[agentName],
          });

          return React.createElement(WrappedComponent, {
            ...newProps,
            molecule,
          });
        })
      );
    };

    WithAgentContainer.displayName = `WithAgent(${getDisplayName(
      WrappedComponent
    )})`;

    return WithAgentContainer;
  };
};

/**
 * <WithAgent agent="loader">{({agent, molecule}) => ()}</WithAgent>
 */
export function WithAgent({ children, agent }) {
  return React.createElement(
    withAgent(agent)(({ agent, molecule }) => {
      return children({ agent, molecule });
    })
  );
}

/**
 * <WithMolecule>{molecule => ()}</WithMolecule>
 */
export function WithMolecule({ children }) {
  return React.createElement(
    withMolecule(({ molecule }) => {
      return children(molecule);
    })
  );
}
