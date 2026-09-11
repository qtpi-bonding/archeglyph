// SPDX-License-Identifier: AGPL-3.0-or-later

import { render } from 'solid-js/web';
import { App } from './shell/app';
import './shell/styles.css';

render(() => <App />, document.getElementById('root')!);
