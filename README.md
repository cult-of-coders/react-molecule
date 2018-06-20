# React Molecule Mini-Framework

Molecule is a super light-weight framework that lets you reason about inter-component communication iterating on FLUX paradigms and introducing a new kind of glue between your components.

Whether you're writing something simple, either you're writing a complex plugin, you will spend time thinking on the following:

- Inter-component communication
- Component Customisability
- Isolation
- Extensability
- Hackability

## By Example

Let's learn by example. Let's say we want a very easy and intuitive way to have two different components that communicate with each other, a search bar and a list of users:

```jsx
import { Molecule } from 'react-molecule';

<Molecule>
  <SearchBar />
  <UserList />
</Molecule>;
```

`SearchBar` contains an input, `UserList` contains the list of users, when we type something in that input from `SearchBar`, we want to filter out the users.

To do this, we will do a little bit of indirection, remember that only Agents can communicate with the outside world. Like, retrieving the users from a remote API, but for now let's assume that a the time of rendering the molecule, you already have the data, so you can pass it to the UserList:

```jsx
<Molecule>
  <SearchBar />
  <UserList users={users} />
</Molecule>
```

As first-level children, `molecule` prop will get automatically injected, but `Molecule` also accepts a function as child passing the `molecule` to it, and you can always use the integrated: `withMolecule(Component)`

So that's how this mysterious `molecule` prop gets in our components. Now back to our case, we have two ways of communicating between SearchBar and UserList, either via modifying Molecule's store, either by dispatching an event at molecule level. Let's explore both ways:

### Communicating via store:

The store of a molecule is an `observable.map()` from MobX:

```jsx
<Molecule store={observable.map()}>
  <SearchBar />
  <UserList users={users} />
</Molecule>
```

```jsx
// in SearchBar
onKeyUp = e => {
  const value = e.target.value;
  const { molecule } = this.props;

  // molecule.store is an observable.map({})
  molecule.store.set('currentSearch', value);
};
```

```jsx
import { observer } from 'mobx-react';


// Here we have the presentational component
function UserList({ users, currentSearch }) {
  const filteredUsers = users.filter(...);
  // just return the list...
}

// By wrapping our component with an observer, every change in what we use here
// "currentSearch" will trigger a re-render:

export default observer({molecule, ...props} => {
  const currentSearch = molecule.store.get('currentSearch');

  // It's your choice where you do the actual filtering, there are many ways to solve the same thing
  // For now we focus on our lib

  return <UserList {...props} currentSearch={currentSearch} />;
});
```

### Communicating via events:

With this approach we don't care about an observable store.

```jsx
// in SearchBar
onKeyUp = (e) => {
  const { molecule } = this.props;
  const value = e.target.value;

  molecule.emit('search.updated', value);
}

render() {
  <input onKeyUp={this.onKeyUp} placeholder="Type here..."/>
}
```

```jsx
// in UserList
componentWillMount() {
  const { molecule } = this.props;

  molecule.on('search.updated', value => {
    this.setState({currentSearch: value})
  })
}

// You don't care about using 'off' for events in your molecule, because it'll all be cleared when the <Molecule> gets unmounted
// However if you have this inside your molecule component may get unmounted leaving the <Molecule> still mounted
// Avoid memory leaks by it out yourself molecule.off('event', handler)
```

So far so good, just for simple inter-communication between components, in an isolated fashion, you can do it, with few lines of code, and very intuitively.

But now, what to choose and when ? The truth is that it doesn't matter, but we suggest that you try to use the `store` option first, and if you see it's not fit, go towards the event-based approach.

We mentioned `Agents` above, where we described that they are the ones responsible of communicating with the outside world. Why introduce this when we can already communicate just fine from our `Atoms` within our `Molecules`?

Because this is where you can create highly re-usable and hackable plugins for your app, where Agents care about logic, Atoms care more about rendering stuff and calling exposed api from Agents.

Let's take the example above, and lets bring our 007 agent. So what we want to do here, is that, when the user searches, he fetches only the users
that match that search from the database.

```jsx
<Molecule agents={{ loader: UserLoader }}>
  <SearchBar />
  <UserList />
</Molecule>
```

We want to do the following things:

1.  SearchBar dispatches an event when search changes
2.  The agent listens to this event and performs propper search and modifies the store
3.  UserList is observing that part of the store

But first, we need to implement the agent, right ? Because our agents need the `molecule` to do their work, what we pass as agents
in our Molecule are a `factory` that accepts molecule as first argument and returns an agent.

```js
import { Agent } from 'storm';

class UserLoader extends Agent {
  init() {
    this.molecule.on('search.updated', value => this.loadUsers(value));
    this.loadUsers();
  }

  loadUsers(value = null) {
    myAPIRequest(value, (err, data) => {
      this.molecule.store.set('users', data);
    });
  }
}

export default UserLoader.factory();
```

That's it. Now you can safely use `users` in your `observer`:

```js
export default observer(props => {
  const { store } = props.molecule;
  const users = store.get('users');

  return <UserList users={users} />;
});
```

What if we want a generic loader, that loads data from an old-school REST-API endpoint, and let's also take the scenario where we have
two agents loading the data from several resources:

```js
import { Agent } from 'storm';
import { observable } from 'mobx';

class GenericLoader extends Agent {
  // This is executed in componentWillMount of the Molecule
  store = observable({
    data: [],
  });

  init() {
    this.load();
  }

  load(value = null) {
    myAPIRequest(this.config.endpoint, (err, data) => {
      this.store.data = data;
    });
  }
}

export default GenericLoader;
```

```jsx
const agents = {
  // the configuration passed in factory gets stored inside `this.config`
  users: GenericLoader.factory({endpoint: '/users'}),
  posts: GenericLoader.factory({endpoint: '/posts'})
}

<Molecule agents={agents}>
  <PostListWithData />
  <UserListWithData />
</Molecule>
```

Now just observe:

```jsx
const PostListWithData = observer(({ molecule }) => {
  const postsAgent = molecule.agents.posts;
  const posts = posts.data;

  return <PostList posts={posts} />;
});
```

So, we can work with agents independently, and each agent has it's own emitter, but can agents work together ?

For example, let's say I have a DataLoader, but I also have a paginator, and I want to decouple this logic, I need the following:

- The pager agent communicates with a counting API, but it also needs stuff like the current filters from another agent.

## Registry

In order to allow full control and hackability, when you use your Atoms, instead of importing methods,
try setting them in the main registry:

```js
import { ComponentRegistry } from 'storm';

ComponentRegistry.set({
  'UserList': UserList
})

// and in render
render() {
  const { molecule } = this.props;

  // Create element directly
  return molecule.registry.createElement('UserList', props);

  // OR get it and use it naturally
  const UserList = molecule.registry.get('UserList');
  return <UserList />
}
```

The advantage is that this give you the ability to either override `ComponentRegistry` globally:

```jsx
ComponentRegistry.set({
  UserList: MyCustomUserList,
});
```

Or do the override only at a molecule level:

```jsx
<Molecule registry={{ UserList: MyCustomUserList }}>
  <MyAtom />
</Molecule>
```

## Agents Lifecycle

An agent has the following lifecycle:

- prepare() This function is executed before initialising all agents, this is useful for hooking into other agent's bussinesses (if they allow it!)
- init() Here you initialise the data, maybe you fetch the initial bits of your data and so on
- clean() Release any resource that your agent may hang on to, you don't have to do .off() on your events this is done automatically.

The agent can expose any API it wants and can modify it's store directly. As a rule of thumb, it's best if your agents modify their own store, via an api they expose, to have clear verbosity.

# That's all folks

That was it, this is what our `molecule` is about, it's so simple, but even a wheel was simple yet it helped a bunch of people do a bunch of stuff.
