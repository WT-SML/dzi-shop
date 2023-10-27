import { router } from './router'

useTitle(
	() => {
		// const { path, meta } = router.currentRoute.value
		// if (meta.title) {
		// 	return `· ${meta.title}`
		// }
		// if (path === '/') {
		// 	return '· home'
		// }
		// return path.replaceAll('/', ' · ')
		return ""
	},
	{
		titleTemplate: `${import.meta.env.VITE_APP_TITLE} %s`,
	},
)
