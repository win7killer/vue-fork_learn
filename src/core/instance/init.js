/* @flow */

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

export function initMixin (Vue: Class<Component>) {

/**
 * @_init
 * - vm._uid
 * - vm._isVue
 * - vm.$options [new Vue 的时候]
 * - initInternalComponent [createComponent 的时候]
 * - dev ? initProxy(vm) : vm._renderProxy = vm
 * - vm._self = vm
 * - initLifecycle
 * - initEvents
 * - initRender
 * - callHook(vm, 'beforeCreate')
 * - initInjections(vm)
 * - initState
 * - initProvide
 * - callHook(vm, 'created')
 * - el ? vm.$mount : 等待调用 $mount
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
      /**
       * - Component [非 Vue root]初始化组件内部属性
       */
      initInternalComponent(vm, options)
    } else {
      // ------------------ merge options --------------
      /**
       * - new Vue 的时候走这里
       */
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

/**
 * @initLifecycle
 * - vm.$parent = parent
 * - vm.$root 到顶层节点，即root vm【Vue 实例】
 * - 定义 vm.$children、$refs、_watcher、_inactive、_directInactive、_isMounted、_isDestroyed、_isBeingDestroyed
 */
    initLifecycle(vm)

/**
 * @initEvents
 * - vm._events = {}
 * - vm._hasHookEvent;
 * - 如果父级有绑定 listeners, updateComponentListeners()
 */
    initEvents(vm)

/**
 * @initRender
 * - vm.$vnode = options._parentVnode
 * - vm.$slots = resolveSlots() 获取对应的$slots
 * - vm.$scopedSlots = {};
 * - vm._c;
 * - vm.$createElement;
 * - defineReactive() // 父组件传下来的 attrs, listeners，即组件调用是给的 attrs && 事件监听，父子通信的一个关键
 */
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
 * - vm._props
 * - toggleObserving(false)
 * - 非生产环境下会检验是否处于 updateChildComponent 阶段，不是的话会警告 props 更新【不是的话，说明不是正常 props 更新或赋值阶段，是由子组件赋值 props 导致的】
 * - defineReactive()
 * - toggleObserving(false)
 */

/**
 * @initMethods
 * - props && vue的实例方法检测
 * - 显示 bind this 到 vue 实例
 */

/**
 * @initdata
 * - 判断是不是 function ? getData : data || {}
 * - 检测和 methods、props 的冲突
 * - proxy()
 * - observe()
 */

/**
 * @observe (vm._data = {}, true)
 */

/**
 * @initComputed
 * - vm._computedWatchers
 * - watchers[key] = new Watcher() // lazy
 * - 如果没挂载到 vm，则 defineComputed()
 */

/**
 * @initWatch
 * - createWatcher
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
      /**
       * @mount
       * - !important 【Render 开始执行的入口】
       */
      vm.$mount(vm.$options.el)
    }
  }
}

/**
 * @initInternalComponent
 * - 应该叫 初始化组件【Component】内部的东西，比如_parent/propsData/_parentListeners等等
 */
export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  // 继承构造函数的 options
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
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
 * @resolveConstructorOptions 处理构造函数的 静态 options，
 * - new Vue 会直接调用
 * - 组件会在 createComponent 里边调用
 */
export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  /**
   * - 组件构造函数，非 root，即 Ctor 是 Component 而不是 Vue
  */
  if (Ctor.super) {
    // 向上递归处理 options
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
