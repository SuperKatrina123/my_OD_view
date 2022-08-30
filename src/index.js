import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import store from './store/index';
import './assets/css/reset.css';
import '../node_modules/antd/dist/antd.min.css';



// @ts-ignore
const root = createRoot(document.getElementById('root'));
root.render(
    <Provider store={store}>
        <App></App>
    </Provider>
)