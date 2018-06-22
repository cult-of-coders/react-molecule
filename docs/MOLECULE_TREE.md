# Molecule Tree

This concept refers to the fact that your molecules can talk with each others through events.

```jsx
const App = (
  <Molecule name="root">
    <UserPage />
  </Molecule>
);

const UserPage = (
  <Molecule name="userPage">
    <SearchBar />
    <UserList />
  </Molecule>
);
```

By default, each event sent out to `userPage` molecule gets to the parent. So it propagates bottom-up. Alternatively you can also emit an event on `root` molecule and send it down to all children:

```js
molecule.deepmit(event, params);
```

How does this help us ?

Well imagine you may want to store a global accessible store from all your molecules. Since all `Atoms` interract with the molecule only. You may want maybe to have a store that knows the current user and its roles.

You could apply this configuration to the root molecule:

```js
import { observable } from 'mobx';

{
  agents: {
    user: UserAgent.factory()
  },
  store: observable.map({
    currentUser: null,
    authenticating: true
  })
}
```

And now when UserLoader initialises we do some fetching and properly updated currentUser:

```js
import { Agent } from 'react-molecule';

class UserAgent extends Agent {
  init() {
    loadMyUserSomehow().then(user => {
      const { store } = molecule;

      store.currentUser = user;
      store.authenticating = false;
    });
  }

  hasRole(role) {
    const { store } = molecule;
    const { currentUser } = store;

    return currentUser.roles.includes(role);
  }

  isAdmin() {
    return this.hasRole('ADMIN');
  }
}
```

You can first have a component on top that displays a loading icon while the user is fetched:

```jsx
import { observer } from 'mobx-react';

const AppMolecule = observer(({molecule}) => {
  const store = { molecule.store };

  if (store.authenticating) {
    return <Loading />
  }

  return <App />
});
```

Now your components can be very smart about this. Your agent can also contain logic about interacting with what it does therefore you can have a deep component, in a deep molecule that can do this:

```jsx
const UserListFilters = ({ molecule }) => {
  // Note the root!
  const userAgent = molecule.root.getAgent('user');
  const isAdmin = userAgent.isAdmin();

  return {
    /* Something based on the isAdmin condition */
  };
};
```

And ofcourse, if you would like the UserListFilters to change if `currentUser` changes (therefore the roles can change), just wrap it in an observer: `observer(UserListFilters)`

As you can see, if all the logic is called through `molecule` testing your components becomes a breeze, as you can smartly mock it and expect different dispatches to it.

There may also be situations where you want to dispatch a `top-down` event to all your molecules. Something like `shut down all your requests` message:

```js
molecule.root.deepmit('shutdown');
```

The possibilities of using this are endless and it is a matter of smartly working with them.

## [Back to Table of Contents](./index.md)
