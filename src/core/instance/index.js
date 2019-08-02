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


eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
