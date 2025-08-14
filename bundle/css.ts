import {registerCSS} from '../src/main.ts';
import type * as Monaco from 'monaco-editor';

declare const monaco: typeof Monaco;

registerCSS(monaco);
