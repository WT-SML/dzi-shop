<script setup lang="ts">
import { zhCN as locale, dateZhCN as dateLocale, darkTheme } from 'naive-ui'
import themeOverrides from '@/theme/overrides'
import { isDark, toggleDark } from 'vue-dark-switch'
</script>

<template>
	<n-config-provider
		:theme-overrides="themeOverrides"
		:locale="locale"
		:date-locale="dateLocale"
		:theme="isDark ? darkTheme : undefined"
	>
		<n-global-style />
		<n-dialog-provider>
			<n-message-provider>
				<router-view />
			</n-message-provider>
		</n-dialog-provider>
	</n-config-provider>
</template>

<style lang="scss"></style>
