import * as React from "react";
import { MoleculeOptions } from "./defs";
import MoleculeContext from "./MoleculeContext";
import MoleculeModel from "./Molecule";
import { withMolecule } from "./withs";

function isElement(element) {
  return React.isValidElement(element);
}

function isDOMTypeElement(element) {
  return isElement(element) && typeof element.type === "string";
}
export interface Props extends MoleculeOptions {
  children?: any;
}

class Molecule extends React.Component<Props> {
  molecule: MoleculeModel;

  constructor(props) {
    super(props);

    let parent = null;
    if (props.molecule instanceof MoleculeModel) {
      parent = props.molecule;
    }

    this.molecule = new MoleculeModel(props, parent);
    this.molecule.init();
  }

  componentWillUnmount() {
    this.molecule.clean();
  }

  render() {
    const { children } = this.props;
    let results;

    if (typeof children === "function") {
      results = children(this.molecule);
    } else {
      results = children;
    }

    return (
      <MoleculeContext.Provider value={this.molecule}>
        {results}
      </MoleculeContext.Provider>
    );
  }
}

export default withMolecule(Molecule);
