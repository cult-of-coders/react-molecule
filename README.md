# React Molecule

[![Build Status](https://travis-ci.org/cult-of-coders/react-molecule.svg?branch=master)](https://travis-ci.org/cult-of-coders/react-molecule)
[![Coverage Status](https://coveralls.io/repos/github/cult-of-coders/react-molecule/badge.svg?branch=master)](https://coveralls.io/github/cult-of-coders/react-molecule?branch=master)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Molecule has been built to allow creation of smart, hackable react libraries. Molecule is esentially a smart context object that allows you to do the following:

- Handles listening, and emissions of events
- Can encapsulate logic to allow easy testing and dependency injection
- Enables component overriding via registry
- Ability to manage a reactive store, isolated from your components

An example where `react-molecule` has been efficiently used is here: https://www.npmjs.com/package/easify

## Install

`npm install --save react-molecule`

```js
import { molecule, useMolecule } from "react-molecule";
const Page = molecule()(PageComponent);

const PageComponent = () => {
  const molecule = useMolecule();
  // Use it
};
```

## Example

Molecule's flexibility is extreme. There are lots of way you can use it. Below we explore an example, where we have a list, and we want to refresh the list when clicking a button.

```jsx
import { Agent } from "react-molecule";

// You define logic in Agents
class InvoiceLoader extends Agent {
  // This runs when the molecule is firstly initialised
  init() {
    this.loadInvoices();
  }

  loadInvoices() {
    const { store } = this.molecule;
    loadInvoiceQuery().then(result => {
      store.invoices = result;
    });
  }
}
```

```jsx
import { molecule, useStore, useAgent } from "react-molecule";
import { observable } from "mobx";
import { observer } from "mobx-react";

// This initialises the molecule by injecting agents, and a reactive store
const InvoiceListPage = molecule(props => {
  return {
    agents: {
      // We want to have a single instance of Agent that can be configured
      invoiceLoader: InvoiceLoader.factory()
    },
    store: observable({
      invoices: []
    })
  };
})(InvoiceList);

const InvoiceList = observer(() => {
  // We can access the molecule's store directly
  const { invoices } = useStore();

  // We can also get access to the agents
  const invoiceLoader = useAgent("invoiceLoader");
  return (
    <ul>
      <li>
        <button onClick={() => invoiceLoader.loadInvoices()}>Refresh</button>
      </li>
      {invoices.map(invoice => {
        <InvoiceItem invoice={invoice} key={invoice._id} />;
      })}
    </ul>
  );
});
```

What do we gain exactly using this approach?

- By isolating logic inside agents, testing `React components` logic transforms into testing `Agents`
- We have a way to store reactive data, in which multiple agents can work together

This is just scratching the surface, let's explore more in the documentation.

## [Documentation](./docs/index.md)

[Start reading the documentation](./docs/index.md) then use the [API](./docs/API.md) for reference.

## [API](./docs/API.md)

After you read the documentation you can use the API for reference:
[Click here to read it](./docs/API.md)

## Support

Feel free to contact us at contact@cultofcoders.com
