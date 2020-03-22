import Leact from './leact';


console.log(Leact.createElement('div', {}));

console.log(Leact.createElement('div', {}, 'asdf'));


const a = Leact.createElement('div', {}, 'Child text');
