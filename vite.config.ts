import Tov from './presets'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
	plugins: [
		Tov(),
		electron({
			entry: 'electron/main.ts',
		}),
		renderer(),
	],
})
