# React Molecule - Concepts

Introducing the concepts of this framework, this is the first phase into understanding the molecule.

## Molecule

The `Molecule` is the React Component that makes communication easier between the children:

```jsx
import { Molecule } from 'react-molecule';

const UserPage = () => {
  return (
    <Molecule>
      <SearchBar />
      <UserList />
    </Molecule>
  );
};
```

The logic and communication are handled by a `molecule` object. You access this `molecule` from the props of nested children.

```jsx
// SearchBar
const SearchBar = ({ molecule }) => {
  return (
    <input onKeyUp={e => molecule.emit('search', { value: e.target.value })} />
  );
};
```

If you have a deeper child not directly under `<Molecule>`, you can access the molecule via a higher order component. (This is done via Context API)

```jsx
import { withMolecule } from 'react-molecule';

const SearchBar = withMolecule(({ molecule }) => {
  // ...
});
```

Alternatively you could pass it like this:

```jsx
import React, { Fragment } from 'react';
import { Molecule } from 'react-molecule';

const UserPage = () => {
  return (
    <Molecule>
      {molecule => (
        <Fragment>
          <SearchBar molecule={molecule} />
          <UserList molecule={molecule} />
        </Fragment>
      )}
    </Molecule>
  );
};
```

You can also avoid using `<Molecule>` component and go towards a more functional style:

```jsx
import { mole } from 'react-molecule';

const UserPage = mole()(({ molecule }) => {
  return (
    <Fragment>
      <SearchBar molecule={molecule} />
      <UserList molecule={molecule} />
    </Fragment>
  );
});
```

We'll dive into how we can configure a Molecule after we understood the concepts.

## Atom

We regard as `Atom` a `Component` inside a `Molecule` which does not interract with the outside world, it only interracts
with the `molecule` object. For example, it does not make an API calls, it does not modify any outside state, it leaves isolated to the molecule it belongs to.

Just to leave it here as an example, below is an atom:

```jsx
const SearchBar = withMolecule(({ molecule }) => {
  return (
    <input onKeyUp={e => molecule.emit('search', { value: e.target.value })} />
  );
});
```

You can have `Components` under your `Molecule` that do communicate with outside world, but we don't regard them as `Atoms`.

## Agent

Agents are the way to interract with the outside world. (Making API calls, modifying client-state, etc)
The principle behind them is that we can have these services that are independent fully of the component and they can contain logic for modifying the components.

For example, an Agent would be a service that loads data from a REST-API endpoint:

```js
import { Agent } from 'react-molecule';

class UserLoader extends Agent {
  loadUsers() {
    return new Promise((resolve, reject) => {
      fetch('https://jsonplaceholder.typicode.com/users')
        .then(response => response.json())
        .then(users => resolve(users));
    });
  }
}
```

An agent needs to extend the `Agent` class so a lot of magic can be done, and essentially what we need to pass to the `Molecule` as `agents` is a map pointing to a factory function that takes in the `molecule` instance as argument.

For example:

```js
agents: {
  users: function(molecule) {
    return new UserLoader({molecule});
  }
}
```

However, we don't have to write that function each time because we have a helper `.factory()` function:

```jsx
const UserPage = () => {
  const agents = {
    loader: UserLoader.factory(),
  };

  return (
    <Molecule agents={agents}>
      <UserList />
    </Molecule>
  );
};
```

Now you can safely call the agent inside `UserList`:

```jsx
class UserList extends Component {
  state = {
    users: [],
  };

  componentDidMount() {
    const { agents } = this.props.molecule;
    agents.loader.loadUsers().then(users => {
      this.setState({ users });
    });
  }

  render() {
    // ....
  }
}
```

But why do we go to such extend to just pass a service that calls a method, can't we just pass it directly?

Yes, we could do that but the main advantage is that our `Agents` get access to the `molecule`, thus enabling communication
with the Components inside the Molecule.

```js
import { Agent } from 'react-molecule';

class UserLoader extends Agent {
  init() {
    this.molecule.on('search', () => {
      fetch('https://jsonplaceholder.typicode.com/users')
        .then(response => response.json())
        .then(users => this.molecule.emit('data_loaded', users);
    })
  }
}
```

If you now take a look at the code above, we can listen to `search` events dispatched from a `<SearchBar />` and inside the `UserList` we could listen for `data_loaded` event and update our state accordingly. There are multiple ways to handle this with molecule, this is just for illustration.

## Registry

Let's say you want to build something re-usable within your application, you will find yourself in situations where you have to map a string to a Component. When you do that simple mapping, you are creating a Component Registry.

Here's how we use it:

```jsx
import { Registry } from 'react-molecule';
import { CustomUserList, CustomSearchBar } from './components';

Registry.blend({
  UserList: CustomUserList,
  SearchBar: CustomSearchBar,
});

const UserPage = () => {
  const { UserList, SearchBar } = Registry;

  return (
    <Fragment>
      <SearchBar />
      <UserList />
    </Fragment>
  );
};
```

Pretty straight forward, right? There are ofcourse, many subtle and interesting aspects of the `Registry` however, they will be explored later on.

The next steps into understanding the molecule is to see the components play! So let's start playing.

## [Back to Table of Contents](./index.md)
