# React Molecule - Examples

Now that we are familiar with the concepts, we are going to take that simple example, with the `SearchBar` and the `UserList`. Basically what we want, is when you type into the `SearchBar`, we want the `UserList` to update properly.

## Event-based Approach

```jsx
// UserPage
const UserPage = mole()(props => {
  const { molecule } = props;

  return (
    <Fragment>
      <SearchBar molecule={molecule} />
      <UserListWithData molecule={molecule} />
    </Fragment>
  );
});

// SearchBar
const SearchBar = ({ molecule }) => {
  return (
    <input onKeyUp={e => molecule.emit('search', { value: e.target.value })} />
  );
};

// UserListWithData
class UserListWithData extends Component {
  state = {
    users: [],
    loading: true,
  };

  constructor(props) {
    super(props);

    const { molecule } = props;

    // Here we listen on 'search' event dispatched by the SearchBar
    // This event can only be listened by components within the molecule.
    molecule.on('search', ({ value }) => {
      this.loadData(value);
    });

    this.loadData();
  }

  loadData(search = '') {
    this.setState({ loading: true });

    fetch(`https://jsonplaceholder.typicode.com/users?q=${search}`)
      .then(response => response.json())
      .then(users => this.setState({ users, loading: false }));
  }

  render() {
    const { loading, users } = this.state;

    if (loading) return 'Please wait...';

    return <UserList users={users} />;
  }
}

const UserList = ({ users }) => (
  <ul>
    {users.map(user => (
      <li>
        {user.name} - {user.email}
      </li>
    ))}
  </ul>
);
```

Note that `UserListWithData` is not an `Atom`, it interracts with the outside world without using `Agents`.

## Reactive-store Approach

For this example we are going to introduce a new configuration option to the `molecule` called `store`.

`Store` can be an object of any form, it's your choice, however we recommend using mobx observables, like this:

```jsx
import { observable } from 'mobx';

// UserPage

// Equivallent with <Molecule store={observable.map()}>...</Molecule>
const UserPage = mole(() => {
  return {
    store: observable.map()
  }
})(props => {
  // Now we have access to molecule.store.get('xxx');
  const { molecule } = props;

  return (
    <Fragment>
      <SearchBar molecule={molecule} />
      <UserListWithData molecule={molecule} />
    </Fragment>
  );
});

// Note that mole() accepts an object as well as a function, the disadvantage with object is that you don't have access to the props and it can be dangerous if you instantiate stores inside it, like observable.map(), because it won't create a new one for each molecule.

// SearchBar
const SearchBar = ({ molecule }) => {
  return (
    <input onKeyUp={e => molecule.store.set('currentSearch', e.target.value)} />
  );
};

// UserListWithData
import { observer } from 'mobx-react';

const UserListObserver = observer(({molecule}) => {
  return <UserListWithData currentSearch={molecule.store.get('currentSearch')} />
})

// Now UserListWithData receives `currentSearch` as prop, no longer listens to any event
// So in order to implement that kind of search you would do the load inside

componentDidMount() {
  // use: this.props.currentSearch and setState
}
componentDidUpdate() {
  // use: this.props.currentSearch and setState
}
```

Different approach, same thing, kinda ? Or not? Well, in the backscenes, there's still some event dispatching going on mobx side,
we modify the store, an event dispatches, and the observers listen to that change and do a re-render.

However, stores are very useful when for example, we want multiple sources to read from it, or we want a place where we keep that value for later reference, like in our case with `currentSearch`.

### Hybrid Approach

The healthiest approach is to use only `Atoms` and do the loading via `Agents`, therefore, what we want to do here, is to dispatch an event that a 'search' has happened, then update the store of the molecule with the fresh users. This should be the job of the agent, here is how it all looks:

```jsx
class UsersLoader extends Agent {
  init() {
    this.molecule.on('userSearch', value => {
      this.loadUsers(value);
    });

    this.loadUsers();
  }

  loadUsers() {
    const store = this.molecule.store;
    store.set('usersLoading', true);

    getTheUsers().then(users => {
      store.set('usersLoading', false);
      store.set('users', users);
    });
  }
}

mole(() => {
  agents: {
    users: UsersLoader.factory();
  },
  store: observable.map()
})(UserPage);

const Events = {
  USER_SEARCH: 'user_search', // { userId: String, value: String }
}
// SearchBar
const SearchBar = ({ molecule }) => {
  return (
    <input onKeyUp={e => molecule.emit('userSearch', e.target.value)} />
  );
};

// UserList
const UserListWithObserve = observer(({ molecule }) => {
  const isLoading = molecule.store.get('usersLoading');
  const users = molecule.store.get('users');

  return <UserList users={users} />
})
```

We use `observable.map()` because we don't know the form of the reactive object, but if we know it, then we can easily use:

```jsx
mole(() => {
  agents: {
    users: UsersLoader.factory();
  },
  store: observable({
    usersLoading: true,
    users: []
  })
})(UserPage);

// Store inside the agent like an object:
Object.assign(molecule.store, {
  usersLoading: false,
  users
})

// And use it like an object!
const UserListWithObserve = observer(({ molecule }) => {
  const { isLoading, users } = molecule.store;

  return <UserList users={users} />
})
```

MobX is a very intelligent reactive store, it can help you a lot!

## Agent Stores

In the example above we use the store at molecule level, but sometimes it may make sense to use it at Agent Level:

```js
class UserAgent extends Agent {
  store = observable({
    loading: true,
    data: [],
  });

  // same init() with listening molecule events

  loadUsers() {
    this.store.loading = true;

    getTheUsers().then(users => {
      Object.assign(this.store, {
        loading: false,
        data: users,
      });
    });
  }
}
```

And in our UserList:

```jsx
const UserListWithObserve = observer(({ molecule }) => {
  const usersAgent = molecule.agents.users;
  const { isLoading, data } = userAgent.store;

  return <UserList users={data} />;
});
```

### Configurable Agent

It's a good idea to re-use agents and not write too much code! You can do it easily.

```jsx
class RESTAgent extends Agent {
  store = observable({
    loading: true,
    data: [],
  });

  init() {
    this.load();
  }

  load() {
    this.store.loading = true;

    fetch(this.config.endpoint) // Notice the config. Will explain later.
      .then(response => response.json)
      .then(data => {
        if (this.config.single) {
          data = data[0];
        }

        Object.assign(this.store, {
          loading: false,
          data,
        });
      });
  }
}
```

```jsx
// Our molecule can receive props such as <UserPageMolecule userId={123} />
const UserPageMolecule = mole(({userId}) => {
  agents: {
    users: RESTAgent.factory({ endpoint: `https://feed.me/users/${userId}`, single: true }),
    posts: RESTAgent.factory({ endpoint: 'https://feed.me/posts' }),
  }
})(UserPage)
```

And now basically you have your data loading in the back-scenes, your components can render naturally, and it all works elegantly.

Note: if you would like to implement search/filtering, you could:

1.  Add a new configuration type (searchEvent) to the RESTAgent:

```jsx
const UserPageMolecule = mole(({userId}) => {
  agents: {
    users: RESTAgent.factory({
      endpoint: `https://feed.me/users/${userId}`,
      single: true,
      searchEvent: 'userSearch'
    }),
    posts: RESTAgent.factory({
      endpoint: 'https://feed.me/users',
      searchEvent: 'postSearch'
    }),
  }
})(UserPage);
```

And when you listen on the molecule, you listen to `this.config.searchEvent`

2.  Dispatch the event directly to the agent:

```jsx
// SearchBar
const SearchBar = ({ molecule }) => {
  const agent = molecule.agents.users;
  return (
    <input onKeyUp={e => agent.emit('search', e.target.value)} />
  );
};

// Inside the Agent
init() {
  // no longer listening on this.molecule
  this.on('search', () => { ... })
}
```

## [Back to Table of Contents](./index.md)
