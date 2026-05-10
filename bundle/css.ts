import {registerCSS} from '../dist/main.js';
import type * as Monaco from 'monaco-editor';

declare const monaco: typeof Monaco;

registerCSS(monaco);
