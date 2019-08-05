/* @flow */

/**
 * @initVue
 */
import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

/**
 *
 * @initMixin
 * - 挂载 Vue.prototype._init
 */
export function initMixin (Vue: Class<Component>) {
  /**
   * @_init 运行
   * - vm._uid
   * - vm._isVue
   * - options._isComponent
   *    ？ initInternalComponent() // 初始化内部组件
   *    : mergeOptions() // 合并 options
   * - vm._renderProxy = vm
   * - vm._self = vm
   * - initLifecycle(vm)
   * - initEvents(vm)
   * - initRender(vm)
   * - callHook(vm, 'beforeCreate')
   * - initInjections(vm) // resolve injections before data/props
   * - initState() : {
   *    @initState 做了什么
   *    - vm._watchers
   *    - initProps()
   *    - initMethods()
   *    - initData() || observe(vm._data = {}, true) // 就是挂载 RootData
   *    - initComputed()
   *    - initWatch()
   * }
   * - initProvide(vm) // resolve provide after data/props
   * - callHook(vm, 'created')
   * - $el ? 自动 vm.$mount(vm.$options.el) : 等待手动 vm.$mount(vm.$options.el)
   */
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm)
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
/**
 * @initState 做了什么
 * - vm._watchers
 * - initProps
 * - initMethods
 * - initData || observe(vm._data = {}, true) // 就是挂载 RootData
 * - initComputed
 * - initWatch
 */

/**
 * @initProps
 *
 */

/**
 * @initMethods
 *
 */

/**
 * @initData
 *
 */

/**
 * @observe (vm._data = {}, true)
 */

/**
 * @initComputed
 */

/**
 * @initWatch
 */
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}


/**
 * @initInternalComponent 运行 【构建组件的时候执行】
 * - opts = vm.$options = Object.create(vm.constructor.options)
 * -
 */
export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  // 继承 vue 构造函数的 options
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  // 这样做比动态枚举速度快
  // opts 挂载组件 options 的 parent 、 _parentVnode
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}


/**
 * @resolveConstructorOptions Vue 初始化 root 节点执行
 */
export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  if (Ctor.super) { // ---------------------------------------  判断是 Vue 构造函数 ？？？？？？？
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
