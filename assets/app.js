import React from 'react';
import ReactDOM from 'react-dom/client';

import ReactApp from './ReactApp.jsx';

const reactAppElement = document.querySelector('#reactApp');
const getMatchs = (json = true) => {
    const value = reactAppElement.getAttribute('data-matchs');
    console.log(value);
    return json ? JSON.parse(value) : value;
};

const root = ReactDOM.createRoot(document.getElementById('reactApp'));

const element = React.createElement(ReactApp, {
    data: getMatchs(),
});

root.render(element);
