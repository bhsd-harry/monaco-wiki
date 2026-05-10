import {registerVue} from '../dist/main.js';
import type * as Monaco from 'monaco-editor';

declare const monaco: typeof Monaco;

void registerVue(monaco);
