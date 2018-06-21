import * as React from 'react';
import { MoleculeOptions } from './defs';
import MoleculeContext from './MoleculeContext';
import MoleculeModel from './Molecule';

export interface Props extends MoleculeOptions {
  children?: any;
}

class Molecule extends React.Component<Props> {
  molecule: MoleculeModel;

  constructor(props) {
    super(props);

    this.molecule = new MoleculeModel(props);
    this.molecule.init();
  }

  componentWillUnmount() {
    this.molecule.clean();
  }

  render() {
    const { children } = this.props;
    let results;

    if (typeof children === 'function') {
      results = children(this.molecule);
    } else {
      results = React.Children.map(children, child => {
        return React.cloneElement(child as React.ReactElement<any>, {
          molecule: this.molecule,
        });
      });
    }

    return (
      <MoleculeContext.Provider value={this.molecule}>
        {results}
      </MoleculeContext.Provider>
    );
  }
}

export default Molecule;
