import {registerVue} from '../src/main.ts';
import type * as Monaco from 'monaco-editor';

declare const monaco: typeof Monaco;

await registerVue(monaco);
