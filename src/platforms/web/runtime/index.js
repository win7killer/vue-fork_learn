/* @flow */

/**
 * Vue 构造函数处理，静态属性、方法，原型属性、方法
 */
import Vue from 'core/index'


/************ 最后再看 ************/
import config from 'core/config'
import { extend, noop } from 'shared/util'
import { mountComponent } from 'core/instance/lifecycle'
import { devtools, inBrowser } from 'core/util/index'

import {
  query,
  mustUseProp,
  isReservedTag,
  isReservedAttr,
  getTagNamespace,
  isUnknownElement
} from 'web/util/index'

import { patch } from './patch'
import platformDirectives from './directives/index'
import platformComponents from './components/index'

// install platform specific utils
// 安装平台特定工具
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement

// install platform runtime directives & components
// 安装平台对应的运行指令和组件
extend(Vue.options.directives, platformDirectives)
extend(Vue.options.components, platformComponents)
/************ 最后看 END ************/

// install platform patch function
// 安装平台的 patch 方法
Vue.prototype.__patch__ = inBrowser ? patch : noop

// public mount method
// 公用的 mount 方法
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}

// devtools global hook
// /* istanbul ignore next */
// if (inBrowser) {
//   setTimeout(() => {
//     if (config.devtools) {
//       if (devtools) {
//         devtools.emit('init', Vue)
//       } else if (
//         process.env.NODE_ENV !== 'production' &&
//         process.env.NODE_ENV !== 'test'
//       ) {
//         console[console.info ? 'info' : 'log'](
//           'Download the Vue Devtools extension for a better development experience:\n' +
//           'https://github.com/vuejs/vue-devtools'
//         )
//       }
//     }
//     if (process.env.NODE_ENV !== 'production' &&
//       process.env.NODE_ENV !== 'test' &&
//       config.productionTip !== false &&
//       typeof console !== 'undefined'
//     ) {
//       console[console.info ? 'info' : 'log'](
//         `You are running Vue in development mode.\n` +
//         `Make sure to turn on production mode when deploying for production.\n` +
//         `See more tips at https://vuejs.org/guide/deployment.html`
//       )
//     }
//   }, 0)
// }

export default Vue
