# React Molecule - Concepts

Introducing the concepts of this framework, this is the first phase into understanding the molecule.

## Molecule

The `Molecule` is the React Component that makes communication easier between all the children it envelops.

```jsx
import { molecule } from "react-molecule";

const UserPage = molecule()(() => {
  return (
    <>
      <SearchBar />
      <UserList />
    </>
  );
};
```

By default molecule contains an `EventEmitter` stored in `molecule.emitter` in which all children can interact with each other.

## Agent

Agents are the way to interact with the outside world. (Making API calls, modifying client-state, etc.)
The principle behind them is that we can have these services that are fully independent of the component and they can contain logic for modifying components.

For example, an Agent would be a service that loads data from a REST-API endpoint:

```js
import { Agent } from "react-molecule";

class UserLoader extends Agent {
  loadUsers() {
    return new Promise((resolve, reject) => {
      fetch("https://jsonplaceholder.typicode.com/users")
        .then(response => response.json())
        .then(users => resolve(users));
    });
  }
}
```

An agent needs to extend the `Agent` class so a lot of magic can be done, and essentially what we need to pass to the `Molecule` as `agents` is a map pointing to a factory function that takes in the `molecule` instance as argument.

```jsx
const UserPage = molecule(() => {
  agents: {
    loader: UserLoader.factory()
  }
}) => <UserList />);
```

Now you can safely call the agent inside `UserList`, and expect a response.

```jsx
const UserList = () => {
  const loader = useAgent("loadUsers");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loader.loadUsers().then(users => setUsers);
  });

  return "...";
};
```

But why do we go to such extent to just pass a service that calls a method, can't we just pass it directly?

Yes, we could do that but the main advantage is that our `Agents` get access to the `molecule`, thus enabling communication
with the Components inside the Molecule.

```js
import { Agent } from 'react-molecule';

class UserLoader extends Agent {
  init() {
    const { molecule } = this;

    molecule.on('search', () => {
      fetch('https://jsonplaceholder.typicode.com/users')
        .then(response => response.json())
        .then(users => molecule.emit(`data::loaded`, users);
    })
  }
}
```

This means, that my children or other agents, can listen to this `molecule-level event` and react to it accordingly.

Agent also support configuration:

```jsx
const UserPage = molecule(
  () => ({
    agents: {
      loader: RESTAPILoader.factory({
        endpoint: "http://rest.me/users"
      })
    }
  }),
  () => <UserList />
);
```

And inside `RESTAPILoader` you can access this via `this.config.endpoint` inside your functions.

## Agent Lifecycle

When the molecule comes alive it instantiates the agents and injects `molecule` into them.

Agent has two methods `prepare()` and `init()`, first the molecule runs `prepare()` on all agents,
then runs `init()` on all agents. Conceptually the reason for both is that sometimes other agents may want to change
the behavior of other agents before they do initialisation.

So we can regard `prepare()` phase as a phase where we hook between agents.
When the component gets unmounted `clean()` method is called on all agents.

Summary:

- validate(config) (You can do validation on the configuration of the Agent)
- prepare() (Hook into other agents)
- init() (Do your thing)
- clean() (Don't leave anything hanging)

## Configurability

When you instantiate an agent or a molecule with a specific config, then that config must not change in the life-span of the molecule or the agents.

Molecules and agents can be configured so their behavior can be customised, or the children can render/act differently depending on these configs, example:

```jsx
import { molecule, useAgentConfig, useConfig } from "react-molecule";

const MyPage = () => {
  const { multiply } = useAgentConfig("calculator"); // agent-level config
  const { listType } = useConfig(); // molecule-level config

  // Act differently based on these configs
};

export default molecule(props => ({
  config: {
    listType: "simple"
  },
  agents: {
    calculator: CalculatorAgent.factory({
      multiply: 0.9
    })
  }
}))(MyPage);
```

## Registry

Let's say you want to build a sort of mini library for your nice application, and you would like to allow overriding of certain components within your mini-lib, here's how you can do it via a `Global Registry`:

```jsx
import { Registry, useRegistry } from "react-molecule";
import { CustomUserList } from "./components";

Registry.blend({
  UserList: CustomUserList
});

const UserPage = () => {
  const { UserList } = useRegistry();

  return <UserList />;
};
```

Pretty straight forward, right? There are of course, many subtle and interesting aspects of the `Registry` however, they will be explored later on.

Now the interesting aspect of Registry is that it can be at the molecule level, and other molecules can override it:

```jsx
import { Registry, useRegistry } from "react-molecule";
import { CustomUserList, MoleculeCustomUserList } from "./components";

Registry.blend({
  UserList: CustomUserList
});

const UserPage = molecule(
  () => ({
    registry: {
      UserList: MoleculeCustomUserList
    }
  }),
  () => {
    const { UserList } = useRegistry();

    // It'll actually be MoleculeCustomUserList
    return <UserList />;
  }
);
```

## Inter-communication between agents

Now things do start to get interesting. The reason why we decoupled the logic from the molecule itself through agents, is that agents can be coded in such a way that they allow their behavior to be manipulated by other agents.

Let's think about it this way, we have a data-loader agent (loads data from a REST api), and we have a search-agent (modifies the request in such a way that it permits searching)

In order to implement two different agents one for loading and one for searching, they need to be able to:

- `SearchAgent` may modify the request of `DataLoader`
- `SearchAgent` may trigger a data reload of `DataLoader`

Let's see how this manipulation can be done through events.

```js
class DataLoaderAgent extends Agent {
  static events = {
    preLoad: "preLoad"
  };

  store = observable({
    results: []
  });

  init() {
    this.load();
  }

  load() {
    const { endpoint } = this.config;
    let payload = { endpoint };

    // Here we emit an event that can be manipulated by it's listeners.
    this.emit(DataLoaderAgent.events.preLoad, payload);

    fetch(payload.endpoint)
      .then(r => r.json())
      .then(results => {
        this.store.results = results;
      });
  }
}
```

By emitting that event, we can have other agents listen to that event and modify it.

```js
class SearchAgent extends Agent {
  static events = {
    search: "search"
  };

  prepare() {
    // Note that we can pass the agent's name in SearchAgent's factory
    // If you use consistent name, you can just rely on just 'agent' or 'loader'

    // Keep in mind you're in molecule territory here
    this.loader = this.getAgent(this.config.agent);

    // We hook in here to make absolutely sure that the loader doesn't do initial loading at init()
    this.loader.on(DataLoaderAgent.events.preLoad, payload => {
      // we can manipulate it here every time
      payload.endpoint = payload.endpoint + `?q=${this.store.currentSearch}`;
    });
  }

  search(value) {
    // Agent-level listener:
    this.store.currentSearch = search;
    this.loader.load();
  }
}
```

Implementing the molecule:

```js
const UserPageMolecule = molecule(
  () => ({
    agents: {
      search: SearchAgent.factory({ agent: "loader" }),
      loader: DataLoaderAgent.factory({
        endpoint: "https://jsonplaceholder.typicode.com/users"
      })
    }
  }),
  UserPage
);
```

```jsx
const UserPage = () => {
  const searchAgent = useAgent("search");

  return (
    <>
      <input onKeyUp={e => searchAgent.search(e.target.value)} />
      <UserList />
    </>
  );
};

const UserList = () => {
  const { results } = useAgentStore("loader");
  // render the results
};
```

You could say, hey, I can implement search in my data-loader agent, and that wouldn't be a problem. However, imagine
a data-grid, where you have: search, pagination, per-page, filters, sorting. Plus, the fact that you allow this hackability
is a big step forward.

## Debugging

Sometimes, events can be very hard to debug, this is why molecule has a special variable `debug`, while enabled it will console.log all the event activity, you can also use it in the agent to log information relevant to your agent functionality:

```jsx
// inside Agent's methods:
if (this.isDebug()) {
  // console.log something
}
```

```js
molecule(
  () => ({
    debug: true,
    agents: {
      loader: DataLoader.factory()
    }
  }),
  Page
);
```

## Events Clean-up

You do not have to worry about `deserialising` your events, they are automatically cleaned, at `Agent` and `Molecule` level when the molecule gets unmounted. However, if you have children, that listen of events of `Agent` and `Molecule`, you'll have to handle the cleanup yourself if they can get unmounted while the molecule is still alive (mounted).

## [Back to Table of Contents](./index.md)
