# Redux & Molecule

So, Redux is FLUX, with few principles enforced. But it's still FLUX. You could work with it very naturally as it offers you the set of tools to build highly maintainable components that are easy to understand and speedy.

Ofcourse, redux has a lot of tooling around it and definitely better integration with React, but it follows the principles:

1.  Single source of truth (molecule level truth though)
2.  Mutations are pure functions
3.  State is read only

You could implement Redux principles in molecule, by using something like this:

```js
// First we create our ReduxAgent
mole(() => {
  store: {
    todos: []
  },
  agents: {
    redux: ReduxAgent.factory()
  },
  debug: true
})(UserPage)
```

Craft your reducer, the function that updates the state based on payload

```js
const todoAddReducer = (store, payload) => {
  const { event, todo } = payload

  if (event !== 'todo.add') {
    return;
  }

  const { todos } = store;

  return Object.assign({}, store, {
    todos: [...todos, todo]
  }
}
```

Our agent should listen to events, apply reducers, then communicate change (also via events) that store got updated

```js
class ReduxAgent extends Agent {
  reducers = [todoAddReducer];

  init() {
    const { molecule } = this;

    molecule.on('payload', payload => {
      molecule.store = this.reduce(molecule.store, payload);

      molecule.emit('store.updated', molecule.store);
    });
  }

  reduce(store, payload) {
    this.reducers.forEach(reducer => {
      store = reducer(store, payload);
    });

    return store;
  }
}
```

Now our component can use it:

```js
class TodoList extends Component {
  componentDidMount() {
    const { molecule } = this.props;

    this.setState({store: molecule.store});
    molecule.on('store.updated', store => this.setState({ store }))
  }

  onAdd = (todo) => {
    const { molecule } = this.props;

    molecule.emit('payload', {
     event: 'todo.add',
     todo: { text: 'Implemented Redux' }
    });
  }

  render() {
    const { todos } = this.state.store;

    return (
      <ul>
        {todos.map(todo => <li>{todo.text</li>)}
        <li>
          <button onClick={this.onAdd}>Add</button>
        </li>
      </ul>
    )
    // render them
  }
}
```

This is just an example, you can implement Redux in many other ways with `molecule`, this is just an example to show you the sheer power of `molecule`.

With a few hacks you can actually create a fully featured integration with this paradigm, remember, coding should always be easy, and redux principles are easy.
