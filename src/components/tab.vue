<script setup lang="ts">
import osd from 'openseadragon'
import initPainter from '@/components/vue-osd-painter'
import { SUPPORT_FILE_TYPES } from '@/constants'
import path from 'path'
import { initNavigatorSubline } from '~/tools/viewer'
import { defaultOsdConfig } from '@/constants/openseadragon-config'
import { isDark, toggleDark } from 'vue-dark-switch'

const typeLabelMap = {
	RECT: '矩形', // 矩形
	POLYGON: '多边形', // 多边形
	CIRCLE: '圆', // 圆
	ELLIPSE: '椭圆', // 椭圆
	PATH: '自由曲线', // 路径
	CLOSED_PATH: '闭合曲线', // 闭合路径
	LINE: '直线', // 直线
	ARROW_LINE: '箭头', // 箭头直线
	POINT: '点', // 点
}

// 本地缓存
const storage = require('electron-json-storage')

const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER

const props = defineProps({
	filePath: String,
	isWebsiteAddress: {
		type: Boolean,
		default: false,
	},
})
const emits = defineEmits(['coordUpdate'])
const osdRef = ref(null)

const cacheShapes = storage.getSync(`dziShop(${props.filePath})Shapes`)

const state = reactive({
	viewer: null, // osd 查看器
	painter: null, // 画家对象
	// 绘制的图形
	shapes: Array.isArray(cacheShapes) ? cacheShapes : [],
	isUnSupport: false, // 不支持的文件类型
	zoomRatio: 1, // 缩放倍率
	// 小地图size
	navigatorSize: {
		width: 0,
		height: 0,
	},
	// 形状选项模态框
	shapeOptionModal: {
		isModalShow: false, // 是否展示
		color: '#FF0000', // 颜色
		remark: null, // 备注
	},
})

watch(
	() => state.shapes,
	(newVal) => {
		storage.set(`dziShop(${props.filePath})Shapes`, newVal, (error) => {
			if (error) throw error
		})
	},
	{
		deep: true,
	},
)

// 处理倍率切换
const handleZoomRatioUpdate = (v) => {
	state.zoomRatio = v
	state.viewer.viewport.zoomTo(state.zoomRatio)
}
// 处理形状点击
const handleShapeClick = (shape)=>{
state.painter.panTo(shape)
}
onMounted(async () => {
	if (
		!props.isWebsiteAddress &&
		!SUPPORT_FILE_TYPES.includes(
			path.extname(path.basename(props.filePath)).slice(1),
		)
	) {
		state.isUnSupport = true
		return
	}
	const osdConf = {
		...defaultOsdConfig,
		element: osdRef.value,
		tileSources: props.isWebsiteAddress
			? props.filePath
			: `${VITE_APP_SERVER}/${props.filePath}.dzi`, // 瓦片源
	}
	state.viewer = new osd.Viewer(osdConf)
	// 设置小地图宽高
	const getNavigatorSize = () =>
		new Promise((resolve, reject) => {
			const img = new Image()
			img.src = `${VITE_APP_SERVER}/${props.filePath}_files/8/0_0.jpeg`
			img.onload = () => {
				resolve({
					width: img.width,
					height: img.height,
				})
			}
			img.onerror = () => {
				resolve({
					width: 0,
					height: 0,
				})
			}
		})
	state.viewer.addHandler('open', async () => {
		const navigatorSize = await getNavigatorSize()
		// @ts-ignore
		const { width, height } = navigatorSize
		// @ts-ignore
		state.navigatorSize = navigatorSize
		state.viewer.navigator.setWidth(width)
		state.viewer.navigator.setHeight(height)
		initNavigatorSubline(state.viewer)
		// 初始化为 1 倍
		state.viewer.viewport.zoomTo(1)

		// 秉承 vue 的思想，painter 的配置应该是响应式的数据，起码，最基本的 shapes（要渲染的形状数组） 应该是响应式的，如此一来，你可以直接操作 shapes 数组，进而画布上的形状会随之更新
		const painterConf = {
			viewer: state.viewer, // osd 查看器
			shapes: state.shapes, // 需要渲染的形状
			// 监听新增形状
			onAdd: (shape) => {
				state.shapes.push(shape)
			},
			// 监听删除形状
			onRemove: (shape) => {
				for (const i in state.shapes) {
					if (state.shapes[i].id === shape.id) {
						state.shapes.splice(Number(i), 1)
					}
				}
			},
			// 监听更新形状
			onUpdate: (shape) => {
				for (const k in state.shapes) {
					if (state.shapes[k].id === shape.id) {
						state.shapes[k] = shape
					}
				}
			},
		}
		// 返回的 painter 是该 vue 组件的组件实例，你可以访问该组件实例上的 props、refs 等属性，当然，我也把该组件的 state 暴露给了你，以供你灵活的进行开发
		state.painter = initPainter(painterConf)
		watch(
			() => state.painter.dziCoordByMouse,
			(newVal) => {
				emits('coordUpdate', newVal)
			},
			{
				deep: true,
			},
		)
	})
	state.viewer.addHandler('zoom', (e) => {
		let rate = Number(e.zoom.toFixed(1))
		if (rate < 1) {
			rate = 1
		} else if (rate > 80) {
			rate = 80
		}
		state.zoomRatio = rate
	})
})
defineExpose({
	state,
})
</script>

<template>
	<div class="ctn">
		<!-- 不支持的提示 -->
		<div
			v-if="state.isUnSupport"
			class="w-full h-full flex items-center justify-center"
		>
			<div class="i-ion:ios-warning mr-2"></div>
			不支持的文件类型
		</div>
		<div v-else class="w-full h-full flex">
			<!-- osd 画布 -->

			<div ref="osdRef" class="osd flex-grow"></div>
			<!-- 标注列表 -->
			<div
				v-if="state.shapes.length"
				:class="`shape-list flex-shrink-0 w-200px flex flex-col bg-[#${
					isDark ? '21252B' : 'f8f8f8'
				}] ${
					isDark ? 'border-t border-[#2D313A]' : 'border-l border-[#dfdfdf]'
				}`"
			>
				<div
					:class="`flex-shrink-0 border-b px-10px py-3px border-[#${
						isDark ? '2D313A' : 'dfdfdf'
					}]`"
				>
					标注列表
				</div>
				<div class="overflow-x-hidden overflow-y-auto flex-grow">
					<div
						v-for="(item, i) in state.shapes"
						:key="item.id"
						:class="`px-10px py-3px cursor-pointer hover:bg-[#${
							isDark ? '2B4140' : 'E1EFE8'
						}]`"
						:title="item.remark || `${typeLabelMap[item.type]}-${item.id}`"
						@click="handleShapeClick(item)"
					>
						{{ item.remark || `${typeLabelMap[item.type]}-${item.id}` }}
					</div>
				</div>
			</div>
		</div>
		<!-- 绘图工具栏 -->
		<div
			v-if="state.painter"
			:class="`tools bg-[#${isDark ? '2d313a' : 'F8F8F8'}]`"
		>
			<n-tooltip trigger="hover">
				<template #trigger>
					<div
						:class="[
							'tool-item',
							state.painter.state.mode === state.painter.state.tools.MOVE
								? 'tool-active'
								: '',
						]"
						@click="state.painter.state.mode = state.painter.state.tools.MOVE"
					>
						<div class="i-ion:arrow-move"></div>
					</div>
				</template>
				移动
			</n-tooltip>
			<n-tooltip trigger="hover">
				<template #trigger>
					<div
						:class="[
							'tool-item',
							state.painter.state.mode === state.painter.state.tools.RECT
								? 'tool-active'
								: '',
						]"
						@click="state.painter.state.mode = state.painter.state.tools.RECT"
					>
						<div
							class="i-streamline:interface-geometric-square-square-geometric-design-shape-shapes text-20px"
						></div>
					</div>
				</template>
				矩形
			</n-tooltip>
			<n-tooltip trigger="hover">
				<template #trigger>
					<div
						:class="[
							'tool-item',
							state.painter.state.mode === state.painter.state.tools.POLYGON
								? 'tool-active'
								: '',
						]"
						@click="
							state.painter.state.mode = state.painter.state.tools.POLYGON
						"
					>
						<div
							class="i-streamline:interface-geometric-pentagon-pentagon-design-geometric-shape-shapes text-21px"
						></div>
					</div>
				</template>
				多边形
			</n-tooltip>
			<n-tooltip trigger="hover">
				<template #trigger>
					<div
						:class="[
							'tool-item',
							state.painter.state.mode === state.painter.state.tools.CIRCLE
								? 'tool-active'
								: '',
						]"
						@click="state.painter.state.mode = state.painter.state.tools.CIRCLE"
					>
						<div
							class="i-streamline:interface-geometric-circle-geometric-circle-round-design-shape-shapes text-21px"
						></div>
					</div>
				</template>
				圆
			</n-tooltip>
			<n-tooltip trigger="hover">
				<template #trigger>
					<div
						:class="[
							'tool-item',
							state.painter.state.mode === state.painter.state.tools.ELLIPSE
								? 'tool-active'
								: '',
						]"
						@click="
							state.painter.state.mode = state.painter.state.tools.ELLIPSE
						"
					>
						<div class="i-tabler:oval-vertical text-28px"></div>
					</div>
				</template>
				椭圆
			</n-tooltip>
			<n-tooltip trigger="hover">
				<template #trigger>
					<div
						:class="[
							'tool-item',
							state.painter.state.mode === state.painter.state.tools.PATH
								? 'tool-active'
								: '',
						]"
						@click="state.painter.state.mode = state.painter.state.tools.PATH"
					>
						<div class="i-ph:wave-sine-bold"></div>
					</div>
				</template>
				自由曲线
			</n-tooltip>
			<n-tooltip trigger="hover">
				<template #trigger>
					<div
						:class="[
							'tool-item',
							state.painter.state.mode === state.painter.state.tools.CLOSED_PATH
								? 'tool-active'
								: '',
						]"
						@click="
							state.painter.state.mode = state.painter.state.tools.CLOSED_PATH
						"
					>
						<div class="i-tdesign:curve text-23px"></div>
					</div>
				</template>
				闭合曲线
			</n-tooltip>
			<n-tooltip trigger="hover">
				<template #trigger>
					<div
						:class="[
							'tool-item',
							state.painter.state.mode === state.painter.state.tools.LINE
								? 'tool-active'
								: '',
						]"
						@click="state.painter.state.mode = state.painter.state.tools.LINE"
					>
						<div class="i-ph:line-segment-fill text-23px"></div>
					</div>
				</template>
				直线
			</n-tooltip>
			<n-tooltip trigger="hover">
				<template #trigger>
					<div
						:class="[
							'tool-item',
							state.painter.state.mode === state.painter.state.tools.ARROW_LINE
								? 'tool-active'
								: '',
						]"
						@click="
							state.painter.state.mode = state.painter.state.tools.ARROW_LINE
						"
					>
						<div
							class="i-material-symbols:arrow-right-alt-rounded text-26px"
						></div>
					</div>
				</template>
				箭头
			</n-tooltip>
			<n-tooltip trigger="hover">
				<template #trigger>
					<div
						:class="[
							'tool-item',
							state.painter.state.mode === state.painter.state.tools.POINT
								? 'tool-active'
								: '',
						]"
						@click="state.painter.state.mode = state.painter.state.tools.POINT"
					>
						<div class="i-material-symbols:add-location-alt text-21px"></div>
					</div>
				</template>
				点
			</n-tooltip>
		</div>
		<!-- 倍率工具栏 -->
		<div
			:class="`zoom-ratio absolute bottom-0 bg-[#${
				isDark ? '2D313A' : 'F8F8F8'
			}] px-5px`"
			:style="{
				left: `${state.navigatorSize.width}px`,
				height: `${state.navigatorSize.height}px`,
			}"
			title="缩放倍率"
		>
			<n-slider
				class="!p-0"
				vertical
				:step="0.1"
				:max="80"
				:min="1"
				v-model:value="state.zoomRatio"
				@update:value="handleZoomRatioUpdate"
			/>
		</div>
		<!-- 备注、颜色询问框 -->
		<n-modal
			v-model:show="state.shapeOptionModal.isModalShow"
			preset="card"
			style="width: 600px"
			title="标注选项"
			:mask-closable="false"
		>
			<div>
				<n-input
					v-model:value="state.shapeOptionModal.remark"
					type="text"
					placeholder="描述"
					autofocus
				/>
			</div>
			<template #footer>
				<div class="flex justify-end">
					<n-button
						class="mr-3"
						type="primary"
						secondary
						@click="state.shapeOptionModal.isModalShow = false"
					>
						取消
					</n-button>
					<n-button type="primary" @click="">
						确认
					</n-button>
				</div>
			</template>
		</n-modal>
	</div>
</template>

<style lang="scss" scoepd>
.ctn {
	height: 100%;
	width: 100%;
	display: flex;
	position: relative;
}
.osd {
	width: 100%;
	height: 100%;
}
.shape-list {
}
.tools {
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	bottom: 0;
	display: flex;
	padding: 5px 10px;
	.tool-item {
		width: 30px;
		height: 30px;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		font-size: 25px;
		&:not(:last-child) {
			margin-right: 5px;
		}
	}
	.tool-active {
		border-radius: 4px;
	}
}
.zoom-ratio {
}
</style>

<style lang="scss">
.osd {
	.openseadragon-container {
		div {
			&:nth-child(5) {
				div {
					&:nth-child(1) {
						display: flex !important;
						.navigator {
							border: 1px solid #000 !important;
							.displayregion {
								border: 1px solid #000 !important;
							}
						}
					}
				}
			}
		}
	}
}
.zoom-ratio {
	.n-slider-handle {
		width: 12px !important;
		height: 12px !important;
	}
}
html {
	.tools {
		.tool-active {
			background-color: #a1f5cb;
		}
	}
}
html.dark {
	.tools {
		.tool-active {
			background-color: #5d5d5d;
		}
	}
}
</style>
