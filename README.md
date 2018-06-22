# React Molecule

[![Build Status](https://travis-ci.org/cult-of-coders/react-molecule.svg?branch=master)](https://travis-ci.org/cult-of-coders/react-molecule)
[![Coverage Status](https://coveralls.io/repos/github/cult-of-coders/react-molecule/badge.svg?branch=master)](https://coveralls.io/github/cult-of-coders/react-molecule?branch=master)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Molecule is a light-weight framework that lets you reason about inter-component communication, dependency injection and logic decoupling.

It allows you to reason about the following concepts:

- Inter-component communication
- Component customisability at deep levels
- Isolation
- Extendable & hackable functionality

The principles it adheres to:

- Start simple and easy, expand & organise as you grow
- Use React components just for rendering and reading from a store and dispatching events
- Separation of logic through agents which can be extended by other agents
- Enforces the [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection) pattern for React Components allowing super easy to test components

Works very well with [mobx](https://mobx.js.org/) and [mobx-react](https://github.com/mobxjs/mobx-react) ([as shown in the examples](./docs/EXAMPLES.md)), but you can also apply the [Redux principles](./docs/REDUX.md) with it, or just [pure FLUX](https://facebook.github.io/flux/docs/overview.html). It's a matter of choice, and in some cases you could also combine more concepts in the same app.

## Install

`npm install --save react-molecule`

## [Documentation](./docs/index.md)

Learn how to use React Molecule in an easy and intuitive manner. The documentation provides the learning curve for you to get up to speed and start hacking!

```jsx
import { Molecule } from 'react-molecule';

const UserPage = props => (
  <Molecule>
    <SearchBar />
    <UserList />
  </Molecule>
);

const SearchBar = ({ molecule }) => (
  <input onKeyUp={(e) => molecule.emit('search', e.target.value)}
)

// Now you could listen to any events inside the molecule from any components inside it
```

[Start reading the documentation](./docs/index.md) then use the [API](./docs/API.md) for reference.

## [API](./docs/API.md)

After you read the documentation you can use the API for reference:

[Click here to read it](./docs/API.md)

## Support

Feel free to contact us at contact@cultofcoders.com
