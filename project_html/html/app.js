//IE8兼容
require('es5-shim');
require('es5-shim/es5-sham');
require('console-polyfill');

import './styles/common.less'
import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'

import Root from './components/Root'

const render = Component => {
    ReactDOM.render(
        <AppContainer>
            <Component />
        </AppContainer>,
        document.getElementById('app')
    )
}

render(Root);

if (module.hot) {
    module.hot.accept('./components/Root', () => render(require('./components/Root').default));
  }