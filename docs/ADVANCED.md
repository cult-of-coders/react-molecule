# React Molecule - Advanced Concepts

As we evolve our app and write hackable, configurable modules, we need to dive deeper and understand more about the power of the molecule.

## Configurable Molecules

You could also pass configuration to your molecules, configuration that can be read by agents or atoms.

For example, you may have re-usable atoms, that render or behave based on the molecule's configuration.

```jsx
// or as component: <Molecule config={}>
const UserPageMolecule = mole(() => {
  config: {
    theme: 'dark',
  },
})(UserPage);

const UserPage = ({ molecule }) => {
  const { theme } = molecule.config;

  return (
    <Layout className={theme}>
      <SearchBar />
      <UserList />
    </Layout>
  );
};
```

Nothing stops you of using `store` to define the theme in there, and if you use `observable` from it you can have it reactive with ease, howevs, we thought that there should be another dimension to the molecule for this kind of data. `store` can change, `config` shouldn't, that's how we can think about it.

## Agent Lifecycle

When the molecule comes alive it creates the agents and injects `molecule` into them.

Agent has two methods `prepare()` and `init()`, first the molecule runs `prepare()` on all agents,
then runs `init()` on all agents. Conceptually the reason for both is that sometimes other agents may want to change
the behavior of other agents before they do initialisation.

So we can regard `prepare()` phase as a phase where we hook between agents.

When the component gets unmounted `clean()` method is called on all agents.

So:

- validate(config) (You can do validation on the configuration of the Agent)
- prepare() (Hook into other agents )
- init() (Do your thing)
- clean() (Don't leave anything hanging)

## Inter-communication between agents

Now things do start to get interesting. The reason why we decoupled the logic from the molecule itself through agents, is that agents can be coded in such a way that they allow their behavior to be manipulated by other agents.

Let's think about it this way, we have a data-loader agent (loads data from a REST api), and we have a search-agent (modifies the request in such a way that it permits searching)

In order to implement two different agents one for loading and one for searching, they need to be able to:

- Search Agent may modify the request url of Data Loader
- Search Agent may trigger a data reload of Data Loader

Let's see how this manipulation can be done through events.

```js
class DataLoaderAgent extends Agent {
  store = observable({
    results: [],
  });

  init() {
    this.load();
  }

  load() {
    const { endpoint } = this.config;
    let payload = { endpoint };

    // Here we emit an event that can be manipulated by it's listeners.
    this.emit('pre_load', payload);

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
  store = observable({
    currentSearch: ''
  })

  prepare() {
    // Note that we can pass the agent's name in SearchAgent's factory
    // If you use consistent name, you can just rely on just 'agent' or 'loader'

    // Keep in mind you're in molecule territory here
    this.loader = this.getAgent(this.config.agent);

    // We hook in here to make absolutely sure that the loader doesn't do initial loading at init()
    this.loader.on('pre_load', (payload) => {
        // we can manipulate it here every time
        payload.endpoint = payload.endpoint + `?q=${this.store.currentSearch}`
      }
    )
  }

  init() {
    this.on('search', () => {
      // You can just trigger a search when an event gets emitted
      this.loader.load();
    }
  }
}
```

Implementing the molecule:

```js
const UserPageMolecule = mole(() => {
  return {
    agents: {
      search: SearchAgent.factory({ agent: 'loader'})
      loader: DataLoaderAgent.factory({ endpoint: 'https://jsonplaceholder.typicode.com/users' })
    }
  }
}, UserPage)
```

Now you can have independent components that instead of iterating on their logic, you could just extend them.

You could say, hey, I can implement search in my data-loader agent, and that wouldn't be a problem. However, imagine
a data-grid, where you have: search, pagination, per-page, filters, sorting. You have a lot of different functionalities you start to think that working with events this can get crazy! But it does not.

Isn't this beautiful? We now have a system that is inter-connected, can manipulate each other elegantly and on top of everything the components used are completely hackable, let's find out how.

## Advanced Registry Usage

We talked about the `Registry` concept, let's dive a bit deeper into it.

Each `Registry` can have a parent:

```js
const myCustomRegistry = createRegistry(
  {
    UserItem: CustomerUserItem,
  },
  Registry
);

Registry.blend({
  UserItem,
  Tooltip,
});
```

Now, if I do:

```js
// This will fetch it from myCustomRegistry -> CustomUserItem
const { UserItem } = myCustomRegistry;

// This will fetch Tooltip from parent registry
const { Tooltip } = myCustomRegistry;
```

When initialising a molecule, it creates it's own Registry that can be manipulated!

```js
mole(() => {
  return {
    registry: {
      DatagridItem: MyCustomDatagridItem,
    },
  };
})(UserList);
```

```js
const Datagrid = ({ molecule }) => {
  const { DatagridHeader, DatagridItem } = molecule.registry;
};

mole(() => {
  return {
    registry: {
      DatagridItem: MyCustomItem,
    },
  };
})(Datagrid);
```

## Some tips & tricks

Sometimes using children as function to inject the property can be very convenient:

```jsx
<WithMolecule>
  {molecule => {
    // In any given molecule
  }}
</WithMolecule>

<WithAgent agent="xxx">
  {{molecule, agent} => {
    // Do your thingie!
  }}
</WithAgent>
```

## Debugging

Debugging happens for events being listened to, dispatched, and being handled.

```jsx
mole({
  name: 'MyCustomMolecule',
  debug: true,
  agents: {
    loader: DataLoader.factory({
      name: 'DataLoader'
      debug: true
    })
  }
})(UserPage);
```

We can name our molecule and agents, to help us understand event debugging messages better.

This can be of tremendous help in development.

Please note that any molecule with debug `true` will automatically make agents in debug mode. So you don't have to specify it for each agent.

## Let's talk Events

Events are a first class citizen and often, when you work with events and you have many of them, and you don't apply healthy patterns to it, your app can become a mess, hard to maintain, too much logic playing everywhere, and you cannot understand it easily because many factors are at play.

There are several things that you need to be aware of when playing with events:

Give them meaningful names and namespace them:

- 'users.todos.add' and not addTodo
- 'global.search.updated' and not search

When using them never rely on strings, rather store them in a centralised place:

```js
const Events = {
  USERS_TODOS_ADD: 'users.todos.add',
  GLOBAL_SEARCH_UPDATED: 'global.search.updated',
};

// and in consequence:
molecule.emit(Events.USERS_TODO_ADD, { todo });
```

Now if you keep your events properly named and unique, it will be very easy for you to search them in your code base and find all the places they are used.

Another problem that happens right now is that, when you are implementing something new and you already have a set of events, and you want to dispatch something, you have no idea how the payload looks like. And what you would normally do is search the code and see how it was used by a previous developer. This is ridiculous.

This is why emitters in molecule are smart-enough to allow smart-events!

```js
const Events = {
  USERS_TODOS_ADD: {
    name: 'users.todos.add',
    validate(payload) {
      // This should throw an exception if it's not valid
      // Here we are using: https://docs.meteor.com/api/check.html#check
      check(payload, {
        todo: Object,
        userId: String,
      });
    },
  },
};
```

```js
molecule.emit(Events.USERS_TODOS_ADD, {
  todo,
  userId,
});

molecule.on(Events.USERS_TODOS_ADD, ({ userId, todo }) => {
  // handle it here
});
```

This is a very elegant way of dealing with all the problems that may arise from playing with events. With the help of `debug: true` at agent or molecule level, you can now have full visibility of what is going on in your app.

In our examples inside the README we did not follow these principles because we wanted to make it easy to understand the concepts. However when you're building your app, be sure to follow them

## Talking from anywhere

As we discussed communication is focused on molecule level, but if you do want to easily communicate through a global 'channel', then you can use the Dispatcher:

```js
import { Emitter } from 'react-molecule';
import { EmitterModel } from 'react-molecule';

const emitter = new EmitterModel();

emitter.emit('xxx');
Emitter.emit('yyy');
```

Just make sure that you de-register events in your `componentWillUnmount`, de-registration for the global `Emitter` is not done automatically when a molecule gets killed.

## [Back to Table of Contents](./index.md)
