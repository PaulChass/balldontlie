/*
 * Welcome to your app's main JavaScript file!
 *
 * We recommend including the built version of this JavaScript file
 * (and its CSS file) in your base layout (base.html.twig).
 */

// any CSS you import will output into a single css file (app.css in this case)
import './styles/app.css';

// start the Stimulus application
import './bootstrap';

require('@fortawesome/fontawesome-free/css/all.min.css');
require('@fortawesome/fontawesome-free/js/all.js');


import React from 'react';
import ReactDOM from 'react-dom';


import ReactApp from './ReactApp.jsx';


const reactAppElement = document.querySelector('#reactApp');
const getMatchs = ( json = true) => {
    const value = reactAppElement.getAttribute(`data-matchs`);
    return json ? JSON.parse(value) : value;
};

const element = React.createElement(ReactApp, {
    data: getMatchs()
});


ReactDOM.render(element, document.getElementById('reactApp'));
