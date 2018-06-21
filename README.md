# React Molecule

[![Build Status](https://travis-ci.org/cult-of-coders/react-molecule.svg?branch=master)](https://travis-ci.org/cult-of-coders/react-molecule)
[![Coverage Status](https://coveralls.io/repos/github/cult-of-coders/react-molecule/badge.svg?branch=master)](https://coveralls.io/github/cult-of-coders/react-molecule?branch=master)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Molecule is a super light-weight framework that lets you reason about inter-component communication iterating on FLUX paradigms and introducing a new kind of glue between your components.

Whether you're writing something simple or a complex plugin, you will spend time thinking about the following:

- Inter-component communication
- Component Customisability
- Isolation
- Extensability
- Hackability

## Install

`npm i -S react-molecule`

## [Documentation](./docs/index.md)

Learn how to use React Molecule in an easy and intuitive manner. The documentation provides the learning curve for you to get up to speed and start hacking!

```jsx
const UserPage = props => (
  <Molecule>
    <SearchBar />
    <UserList />
  </Molecule>
);
```

[Start reading the documentation](./docs/index.md)

## [API](./docs/API.md)

After you read the documentation you can use the API for reference:

[Click here to read it](./docs/API.md)

## Support

Feel free to contact us at
