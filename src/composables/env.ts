/**
 * 是否在开发环境
 * @description 在 `if (IN_DEV)` 块中的代码在 `vite build` 时会自动编译掉，不会带到生产环境
 * @example
 * ```ts
 * if (IN_DEV) {
 *  console.log("开发环境")
 * }
 * ```
 */
export const IN_DEV = import.meta.env.DEV

/**
 * 是否在生产环境
 * @example
 * if (IN_PROD) {
 *  console.log("生产环境")
 * }
 */
export const IN_PROD = import.meta.env.PROD