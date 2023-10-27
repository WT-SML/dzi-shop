import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron'
import { SUPPORT_FILE_TYPES } from '../src/constants'
import {
	setupTitlebar,
	attachTitlebarToWindow,
} from 'custom-electron-titlebar/main'

setupTitlebar()

const createWindow = () => {
	const win = new BrowserWindow({
		width: 1280,
		height: 720,
		titleBarStyle: 'hidden',
		titleBarOverlay: true,
		webPreferences: {
			nodeIntegrationInWorker: true,
			contextIsolation: false,
			nodeIntegration: true,
			webSecurity: false,
		},
	})
	attachTitlebarToWindow(win)

	if (process.env.VITE_DEV_SERVER_URL) {
		win.loadURL(process.env.VITE_DEV_SERVER_URL)
		// 打开开发工具
		// win.webContents.openDevTools()
	} else {
		win.loadFile('dist/index.html')
	}
	const openFolder = async () => {
		const ret = await dialog.showOpenDialog(win, {
			title: '打开文件夹',
			properties: ['openDirectory'],
		})
		if (!ret.canceled) {
			const folderPath = ret.filePaths[0]
			win.webContents.send('open-folder', folderPath)
		}
	}
	ipcMain.on('theme-initiated', (e, isDark) => {
		const template = [
			{
				label: '文件(F)',
				submenu: [
					{
						label: '打开文件...',
						accelerator: 'CmdOrCtrl+O',
						click: async () => {
							const ret = await dialog.showOpenDialog(win, {
								title: '打开文件',
								filters: [
									{
										name: '深度缩放图像文件',
										extensions: SUPPORT_FILE_TYPES,
									},
								],
								properties: ['openFile', 'multiSelections'],
							})
							if (!ret.canceled) {
								const filePaths = ret.filePaths
								win.webContents.send('open-file', filePaths)
							}
						},
					},
					{
						label: '打开文件夹...',
						click: () => {
							openFolder()
						},
					},
					{
						label: '打开网络地址...',
						click: () => {
							win.webContents.send('open-website-address')
						},
					},
					{ type: 'separator' },
					{ label: '导出' },
					{ type: 'separator' },
					{ label: '设置', accelerator: 'CmdOrCtrl+.' },
					{ type: 'separator' },
					{ label: '退出', role: 'quit' },
				],
			},
			// {
			// 	label: '编辑(E)',
			// 	submenu: [
			// 		{
			// 			label: '撤销',
			// 			accelerator: 'CmdOrCtrl+Z',
			// 			role: 'undo',
			// 		},
			// 		{
			// 			label: '恢复',
			// 			accelerator: 'CmdOrCtrl+Y',
			// 			role: 'redo',
			// 		},
			// 		{ type: 'separator' },
			// 		{
			// 			label: '剪切',
			// 			accelerator: 'CmdOrCtrl+X',
			// 			role: 'cut',
			// 		},
			// 		{
			// 			label: '复制',
			// 			accelerator: 'CmdOrCtrl+C',
			// 			role: 'copy',
			// 		},
			// 		{
			// 			label: '粘贴',
			// 			accelerator: 'CmdOrCtrl+V',
			// 			role: 'paste',
			// 		},
			// 		{ type: 'separator' },
			// 		{
			// 			label: '删除',
			// 			role: 'delete',
			// 		},
			// 	],
			// },
			{
				label: '查看(V)',
				submenu: [
					{
						label: '刷新',
						accelerator: 'F5',
						role: 'reload',
					},
					{
						label: '强制刷新',
						accelerator: 'CmdOrCtrl+F5',
						role: 'forcereload',
					},
					{ type: 'separator' },
					{
						label: '切换全屏',
						accelerator: 'F11',
						click: () => {
							win.setFullScreen(!win.isFullScreen())
						},
					},
					{ type: 'separator' },
					{
						label: '实际大小',
						accelerator: 'CmdOrCtrl+0',
						role: 'resetzoom',
					},
					{
						label: '放大',
						accelerator: 'CmdOrCtrl+=',
						role: 'zoomin',
					},
					{
						label: '缩小',
						accelerator: 'CmdOrCtrl+-',
						role: 'zoomout',
					},

					{ type: 'separator' },
					{
						label: '开发者工具',
						role: 'toggledevtools',
						accelerator: 'F12',
					},
				],
			},
			{
				label: '主题(T)',
				submenu: [
					{
						label: '浅色主题',
						type: 'radio',
						checked: !isDark,
						id: 'theme-0',
						click: () => {
							win.webContents.send('theme-change', 0)
						},
					},
					{
						label: '深色主题',
						type: 'radio',
						checked: isDark,
						id: 'theme-1',
						click: () => {
							win.webContents.send('theme-change', 1)
						},
					},
				],
			},
			{
				label: '帮助(H)',
				submenu: [
					{
						label: '官网',
					},
					{
						label: 'Github',
					},
					{
						label: '更新日志',
					},
					// {
					// 	label: '隐私条款',
					// },
					{ type: 'separator' },
					{
						label: '检查更新...',
					},
					// {
					// 	label: '查看许可证...',
					// },
					{
						label: '关于',
					},
				],
			},
		]
		// @ts-ignore
		const menu = Menu.buildFromTemplate(template)
		Menu.setApplicationMenu(menu)
	})
	ipcMain.on('open-folder-front', (e, isDark) => {
		openFolder()
	})
}

app.whenReady().then(() => {
	createWindow()
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit()
})
