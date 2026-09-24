// SPDX-License-Identifier: MPL-2.0

import { render } from 'solid-js/web';
import { App } from './shell/app';
import './shell/styles.css';

render(() => <App />, document.getElementById('root')!);
