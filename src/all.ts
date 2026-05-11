import promise from './wiki.js';
import {registerVue} from './main.js';

Object.assign(globalThis, {
	monaco: (async () => {
		const monaco = await promise;
		await registerVue(monaco);
		return monaco;
	})(),
});
