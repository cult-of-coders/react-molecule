# React Molecule - Concepts

We have several concepts we need to explore:

- Molecule
- Agent
- Registry

## Molecule

The `molecule` is a smart object that is acts as a logic encapsulator (with agents), a communication channel (with events) and a single source of truth.

```jsx
import { molecule, useMolecule } from "react-molecule";

const UserPage = molecule()(() => <UserList />);

const UserList = () => {
  const molecule = useMolecule();
  // getting access to that smart object
};
```

By default molecule contains an `EventEmitter` (npm: [eventemitter3](https://github.com/primus/eventemitter3)) and we can attach and emit events on it directly:

```js
molecule.emit("searching", value);
molecule.on("searching", value => {});
```

## Agent

Agents are the way to interact with the outside world. (making API calls, modifying client-state, processing molecule events, etc)

For example, you have a function that loads data from a REST API, let's put it inside an Agent.

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
  const loader = useAgent("loader");
  const [users, setUsers] = useState([]);

  // this runs only once when the component is first mounted
  useEffect(() => {
    // This example show how we use Agents as simple units of logic
    // We don't really see here how they are tied with the molecule
    loader.loadUsers().then(users => setUsers);
  });

  return "...";
};
```

Let's see how agents can interact inside molecule context:

```js
import { Agent } from "react-molecule";
import { observable } from "mobx";

class UserLoader extends Agent {
  static events = {
    loaded: "userLoader::loaded"
    search: "userLoader::search"
  };

  store = observable({
    users: []
  });

  init() {
    const { molecule } = this;

    this.loadUsers();

    // Note: this event is at agent level, not at the whole molecule level
    this.on(UserLoader.events.search, search => {
      this.loadUsers(search);
    });
  }

  loadUsers(search) {
    return fetch(`https://jsonplaceholder.typicode.com/users?q=${search}`)
      .then(response => response.json())
      .then(users => {
        this.store.users = users;

        // Other agents, or components can listen to this event, and act upon it
        molecule.emit(UserLoader.events.loaded, users);
      });
  }
}
```

So because I have an `observable`, I can easily wrap an observer that would render the users from the agent:

```jsx
import { useAgentStore, useEmitter, useAgent } from "react-molecule";
import { observer } from "mobx-react";

const UserList = observer(() => {
  const { users } = useAgentStore("loader");
  const agent = useAgent();
  return (
    <>
      <input onKeyUp={e => agent.emit(UserLoader.events.search, e.target.value)}>
      {users.map(u => '...')}
    </>
  );
});
```

This means, that my children or other agents, can listen to this `molecule-level event` and react to it accordingly.

Agent also support configuration when passing it to the molecule constructor options:

```jsx
const UserPage = molecule(
  () => ({
    agents: {
      loader: RESTAPILoader.factory({
        endpoint: "http://rest.me/users"
        // And inside `RESTAPILoader` you can access this via `this.config.endpoint` inside your agent's functions.
      })
    }
  }),
  () => <UserList />
);
```

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

You do not have to worry about `deregistering` your event listeners, they are automatically cleaned, at `Agent` and `Molecule` level when the molecule gets unmounted. However, if you have children, that listen of events of `Agent` and `Molecule`, you'll have to handle the cleanup yourself if they can get unmounted while the molecule is still alive (mounted).

## [Back to Table of Contents](./index.md)
