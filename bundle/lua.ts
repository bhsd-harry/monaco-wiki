import {registerLua} from '../src/main.ts';
import type * as Monaco from 'monaco-editor';

declare const monaco: typeof Monaco;

registerLua(monaco);
