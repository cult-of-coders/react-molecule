# API

## Molecule

Molecule is the container of communication for all its components.

```js
import { mole, Molecule } from 'react-molecule';

const Page = () => (
  <Molecule {...options}>
    <Component />
  </Molecule>;
)

// or
const Page = mole(() => options)(Component);
```

### Configuration Options

| Option   | Type                             | Description                                                                                                                                                                                                                                                                                    |
| -------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name     | `string`                         | Give your molecule a name, this can be used for debugging purposes when debug is true                                                                                                                                                                                                          |
| registry | `object` or `ComponentRegistry`  | If you pass a simple object like: `{Item}` it will automatically create a `ComponentRegistry` for you. This options is used to extend the registry at molecule level                                                                                                                           |
| debug    | `boolean`                        | Defaults to _false_. If this option is _true_ then it will log all events that are passed through it (instantiated, emitted, handled)                                                                                                                                                          |
| agents   | `{[agent]: (molecule) => Agent}` | The agents property needs to be a factory of agents. So you either do `{myAgent: (molecule) => new MyAgent({molecule})}` or you can do `{myAgent: MyAgent.factory()}`. You also have the ability to create agents without passing molecule (if you don't need it): `{myAgent: () => MyAgent }` |
| store    | `any`                            | The store can be anything you wish, either a simple map, either an `observable` from [MobX](https://mobx.js.org/)                                                                                                                                                                              |
| config   | `any`                            | You can simply set a configuration at molecule level that would allow the children to read from it and adapt their behavior based on it. This is different from the store because configuration should never be changed. Imagine store as being `state` and config as being `props`            |

### molecule

You can access all the information provided in `config` in the `molecule` model. Exception being `agents`, which are stored as the actual instantiations not the factory functions.

You can also access `molecule.emitter` if you need it. It returns an instance of the `EmitterModel` which is basically `eventemitter3` that allows a special type of Event.

| Member                 | Returns             | Description                                                                                                                              |
| ---------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| getAgent(name)         | Agent               | Returns the defined agents. Throws an `Error` if no agent is found with that name.                                                       |
| registry               | `ComponentRegistry` | This an instantiation of the registry that you provided. If you provided a map, it's a registry that has as parent the global `Registry` |
| emit(event, ...values) | void                | Emits events to the laser-focused molecule. For example `molecule.emit('search', 'John')` this will notify all listeners                 |
| on(event, handler)     | void                | Listens to events emitted to the molecule. `molecule.on('search', (value) => {...})`                                                     |
| once(event, handler)   | void                | Same as `on()` but after the first event is caught it will stop listening to it                                                          |

## Agent

Agent is the way components inside a molecule communicate with outside world.

```js
import { Agent } from 'react-molecule';

class MyAgent extends Agent {}
```

The following members can be overriden:

| Member                 | Returns | Description                                                                                                                                                                                               |
| ---------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| prepare()              | void    | When molecule initialises (component constructs) it first calls prepare() on all agents to give them a chance to hook into each other                                                                     |
| init()                 | void    | This is run after prepare() has run on all agents.                                                                                                                                                        |
| validate(config)       | void    | This refers to the configuration you given when instantiating the agent: `new Agent(config)`. Most likely you pass the config when creating the factory: `{myAgent: MyAgent.factory({ endpoint: '...' })` |
| emit(event, ...values) | void    | Emits events to the laser-focused molecule. For example `agent.emit('search', 'John')` this will notify all listeners                                                                                     |
| on(event, handler)     | void    | Listens to events emitted to the molecule. `agent.on('search', (value) => {...})`                                                                                                                         |
| once(event, handler)   | void    | Same as `on()` but after the first event is caught it will stop listening to it                                                                                                                           |

## Registry

This is where your hackable components co-exist in a sort of JS object with little sugars on top.

```js
// `Registry` represents the global registry of components.
import { Registry } from 'react-molecule';

const Hello = () => 'Hello!'; // Any React Component

Registry.blend({
  Hello,
});

// Now you are able to access it
const { Hello } = Registry;
```

Creating registries:

```js
import { createRegistry } from 'react-molecule';

const Item = () => 'Hello!';
const CustomRegistry = createRegistry({Item}, parent?);
```

If `Item` isn't found, it will try to look for it in the parent, and if the parent has a parent, it will look using a `bottom-up` approach.

```js
CustomRegistry.blend(
  { HelloAgain: MyReactComponent }
  {
    prefix: 'Say', // The name will be prefixed SayHelloAgain => MyReactComponent
    throwOnCollisions: true, // Defaults: false. If there is a pre-existing 'SayHelloAgain' it will throw an exception
  }
);
```

## Emitter

Uses `eventemitter3` npm package. API can be found here: https://nodejs.org/api/events.html

Used in `molecule` and `agents`

Emitter extends the standard one by allowing smart events (which are basically events that can validate their parameters):

```js
import { Emitter, EmitterModel } from 'react-molecule';

const Events = {
  SAY_HELLO: {
    name: 'say.hello',
    validate(params) {
      // Throw if they are invalid
    },
  },
};

Emitter.on(Events.SAY_HELLO, () => {});
Emitter.emit(Events.SAY_HELLO, params);

// Craft your own instances of emitter:
const MyEmitter = new EmitterModel({
  context: 'MyEmitter', // Helpful when debug is true
  debug: true, // Defaults to false. If true, will console.log emits, listenings and handles
});
```

## React Helpers

#### mole

Creating a molecule functional style:

```jsx
import { mole } from 'react-molecule';

const Wrapped = mole(() => MoleculeOptions)(Page);
```

#### withMolecule

Access the enveloping molecule in a nested child. Receives `molecule` inside props.

```jsx
import { withMolecule } from 'react-molecule';

export default withMolecule(UserList);
```

#### withAgent

Access a certain agent from the enveloping molecule in a nested child. Receives `molecule` and `agent` inside props.

```jsx
import { withAgent } from 'react-molecule';

export default withAgent('loader')(UserList);
```

#### <WithMolecule>

Passing the molecule via functional children:

```jsx
import { WithMolecule } from 'react-molecule';

<WithMolecule>{molecule => <UserList molecule={molecule} />}</WithMolecule>;
```

#### <WithAgent>

Passing `{agent, molecule}` via functional children:

```jsx
import { WithAgent } from 'react-molecule';

<WithAgent name="loader">
  {({ agent, molecule }) => <UserList agent={agent} />}
</WithAgent>;
```

Optionally, you could provide `asName` prop to `WithAgent`:

```jsx
import { WithAgent } from 'react-molecule';

<WithAgent name="loader" asName="loader">
  {({ loader, molecule }) => <UserList agent={loader} />}
</WithAgent>;
```
