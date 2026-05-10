import {registerLua} from '../dist/main.js';
import type * as Monaco from 'monaco-editor';

declare const monaco: typeof Monaco;

registerLua(monaco);
