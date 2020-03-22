import Leact from './leact';

let i = 0;

const updateValue = (e: InputEvent) => {
  rerender((e.target as HTMLInputElement).value);
};

// TODO: chrome thread dies when updateValue is triggered
// https://codesandbox.io/s/didact-6-96533 compare with this
const rerender = (input: string) => {
  const button = Leact.createElement('input', {
    oninput: updateValue,
  }, 'click me');

  // wish i had jsx
  const child = Leact.createElement('p', {}, input);
  const parent = Leact.createElement('div', {}, child, button);

  Leact.render(parent, document.getElementById('container'));
};

rerender('world');
