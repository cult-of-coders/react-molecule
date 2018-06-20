import MoleculeContext from './MoleculeContext';
import * as React from 'react';

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export function withMolecule(WrappedComponent): React.StatelessComponent {
  const WithMoleculeContainer: React.SFC = function(props) {
    return (
      <MoleculeContext.Consumer>
        {molecule => <WrappedComponent molecule={molecule} {...props} />}
      </MoleculeContext.Consumer>
    );
  };

  WithMoleculeContainer.displayName = `WithMolecule(${getDisplayName(
    WrappedComponent
  )})`;

  return WithMoleculeContainer;
}

export function withAgent(agentName, asName: string = 'agent') {
  return function(WrappedComponent) {
    const WithAgentContainer: React.SFC = function(props) {
      return React.createElement(
        withMolecule(({ molecule }) => {
          const newProps = Object.assign({}, props, {
            [asName]: molecule.agents[agentName],
          });

          return <WrappedComponent {...newProps} molecule={molecule} />;
        })
      );
    };

    WithAgentContainer.displayName = `WithAgent(${getDisplayName(
      WrappedComponent
    )})`;

    return WithAgentContainer;
  };
}

/**
 * <WithAgent agent="loader">{({agent, molecule}) => ()}</WithAgent>
 */
export function WithAgent({ children, agent }) {
  console.log(agent);
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
