/**
 * ------------------ Vue 真身 ---------------------
 */

import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

// 定义 Vue
function Vue (options) {
  // --------------------- new Vue 运行 ----------------------
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // 运行时，new Vue 的时候，调用init
  this._init(options)
}

/**
 * 对 Vue 构造函数的扩展，各种 mixin。
 */

/**
 * @initMixin 做了什么
 * - 定义 Vue.prototype._init
 */
initMixin(Vue)

/**
 * - 先处理 $data && $props 监听
 * - 定义 $set、$delete、$watch
 */

stateMixin(Vue)

/**
 * @eventsMixin
 * - Vue.prototype.$on
 * - Vue.prototype.$once
 * - Vue.prototype.$off
 * - Vue.prototype.$emit
 * -
 */
eventsMixin(Vue)

/**
 * @lifecycleMixin
 * - Vue.prototype._update
 * - Vue.prototype.$forceUpdate
 * - Vue.prototype.$destroy
 *
 */
lifecycleMixin(Vue)

/**
 * @renderMixin
 * - installRenderHelpers()
 * - Vue.prototype.$nextTick
 * - Vue.prototype._render
 */
renderMixin(Vue)

export default Vue
