/**
 * 比较函数
 * @author Alkaid
 * @param {Object} propertyName
 * @param {Object} isAscending
 * @returns {Number}
 */
export const compare = (propertyName, isAscending) => {
  if (isAscending === undefined) {
    isAscending = 1
  } else {
    isAscending = isAscending ? 1 : -1
  }
  return function (obj1, obj2) {
    let value1 = obj1[propertyName]
    let value2 = obj2[propertyName]
    if (value1 < value2) {
      return isAscending * -1
    } else if (value1 > value2) {
      return isAscending * 1
    } else {
      return 0
    }
  }
}