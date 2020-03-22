import Leact from './leact';

const child = Leact.createElement('p', { className: 'red' }, 'red paragraph')
const parent = Leact.createElement('div', {}, child);

Leact.render(parent, document.getElementById('container'));
