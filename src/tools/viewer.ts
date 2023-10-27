// viewer navigator 相关工具方法
import $ from 'jquery'

/**
 * navigator 辅助线 插件 （这简直是完美的实现）
 * @author Alkaid
 */
export const initNavigatorSubline = (viewer) => {
	const regionDom = $(viewer.container).find(
		'.displayregioncontainer .displayregion',
	)
	const topDom = ` 
  <div
    style="
    width: 1px;
    height: 1000px;
    background-color:rgb(0, 0, 0);
    position: absolute;
    top: -1000px;
    left: 50%;
    transform: translateX(-50%);
  ">
  </div>`
	const bottomDom = ` 
  <div
    style="
    width: 1px;
    height: 1000px;
    background-color:rgb(0, 0, 0);
    position: absolute;
    bottom: -1000px;
    left: 50%;
    transform: translateX(-50%);
  ">
  </div>`
	const leftDom = ` 
  <div
    style="
    width: 1000px;
    height: 1px;
    background-color:rgb(0, 0, 0);
    position: absolute;
    top: 50%;
    left: -1000px;
    transform: translateY(-50%);
  ">
  </div>`
	const rightDom = ` 
  <div
    style="
    width: 1000px;
    height: 1px;
    background-color:rgb(0, 0, 0);
    position: absolute;
    top: 50%;
    right: -1000px;
    transform: translateY(-50%);
  ">
  </div>`

	regionDom.css('overflow', 'unset')
	regionDom.append(topDom)
	regionDom.append(bottomDom)
	regionDom.append(leftDom)
	regionDom.append(rightDom)
}
