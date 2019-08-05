/* @flow */

import config from '../config'
import Watcher from '../observer/watcher'
import Dep, { pushTarget, popTarget } from '../observer/dep'
import { isUpdatingChildComponent } from './lifecycle'

import {
  set,
  del,
  observe,
  defineReactive,
  toggleObserving
} from '../observer/index'

import {
  warn,
  bind,
  noop,
  hasOwn,
  hyphenate,
  isReserved,
  handleError,
  nativeWatch,
  validateProp,
  isPlainObject,
  isServerRendering,
  isReservedAttribute
} from '../util/index'

const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

export function proxy (target: Object, sourceKey: string, key: string) {
  /*
  Object.defineProperty(target, key, {
    get() {
      return this[sourceKey][key]
    },
    set(val) {
      this[sourceKey][key] = val
    }
  })
   */
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}


/**
 * @initProps
 * - vm._props
 * - toggleObserving(false)
 * - 非生产环境下会检验是否处于 updateChildComponent 阶段，不是的话会警告 props 更新【不是的话，说明不是正常 props 更新或赋值阶段，是由子组件赋值 props 导致的】
 * - defineReactive()
 * - toggleObserving(false)
 */
function initProps (vm: Component, propsOptions: Object) {
  const propsData = vm.$options.propsData || {}
  const props = vm._props = {}
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  const keys = vm.$options._propKeys = []
  const isRoot = !vm.$parent
  // root instance props should be converted
  if (!isRoot) {
    toggleObserving(false)
  }
  for (const key in propsOptions) {
    keys.push(key)
    const value = validateProp(key, propsOptions, propsData, vm)
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const hyphenatedKey = hyphenate(key)
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        )
      }
      defineReactive(props, key, value, () => {
        // 非生产环境下会检验是否处于 updateChildComponent 阶段，不是的话会警告 props 更新【不是的话，说明不是正常 props 更新或赋值阶段，是由子组件赋值 props 导致的】
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
            `overwritten whenever the parent component re-renders. ` +
            `Instead, use a data or computed property based on the prop's ` +
            `value. Prop being mutated: "${key}"`,
            vm
          )
        }
      })
    } else {
      defineReactive(props, key, value)
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    // 静态的 props 已经通过 Vue.extend 挂载在 vm 组件【实例】上，这里只用代理实例化的时候的 props
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  // 切换全局 ob 观测值，开始观测
  toggleObserving(true)
}

/**
 * @initdata
 * - 判断是不是 function ? getData : data || {}
 * - 检测和 methods、props 的冲突
 * - proxy()
 * - observe()
 */
function initData (vm: Component) {
  let data = vm.$options.data
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  // 检测是否为纯粹的 obj，而不是 function、reg 等
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) { // 和 methods 冲突
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    if (props && hasOwn(props, key)) { // 和 props 冲突
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      // 不是以 _ $ 开头，代理到 _data 上
      proxy(vm, `_data`, key)
    }
  }
  // observe data  Object 观测数据
  observe(data, true /* asRootData */)
}

export function getData (data: Function, vm: Component): any {
  // #7573 disable dep collection when invoking data getters
  // 挂载 Dep.target [watcher实例]
  pushTarget()
  try {
    // dataFn.call(vm, vm) // this 指向 vm，并把 vm 作为参数参进去
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, `data()`)
    return {}
  } finally {
    // watcher实例出栈，回复上一次的watcher
    popTarget()
  }
}

const computedWatcherOptions = { lazy: true }


/**
 * @initComputed
 * - vm._computedWatchers
 * - watchers[key] = new Watcher() // lazy
 * - 如果没挂载到 vm，则 defineComputed()
 */
function initComputed (vm: Component, computed: Object) {
  // $flow-disable-line
  const watchers = vm._computedWatchers = Object.create(null)
  // computed properties are just getters during SSR
  const isSSR = isServerRendering()

  for (const key in computed) {
    const userDef = computed[key]
    // 获取 getter
    const getter = typeof userDef === 'function' ? userDef : userDef.get

    // getter 不存在警告
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        `Getter is missing for computed property "${key}".`,
        vm
      )
    }

    if (!isSSR) {
      // create internal watcher for the computed property.
      // 为每个 computed 创建对应的 watcher, 且是 lazy: true
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      )
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.

    // 定义实例化时候的 computed

    if (!(key in vm)) {
      defineComputed(vm, key, userDef)
    } else if (process.env.NODE_ENV !== 'production') {
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      }
    }
  }
}

/**
 * @defineComputed
 * - shouldCache = ssr ? false : true
 * - computed 对象的 getter = createComputedGetter(key)
 */
export function defineComputed (
  target: any,
  key: string,
  userDef: Object | Function
) {
  const shouldCache = !isServerRendering()
  // sharedPropertyDefinition.get 获取到计算属性的 getter
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : createGetterInvoker(userDef)
    sharedPropertyDefinition.set = noop
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop
    sharedPropertyDefinition.set = userDef.set || noop
  }
  if (process.env.NODE_ENV !== 'production' &&
      sharedPropertyDefinition.set === noop) {
        // 未设置 set，却赋值，发出警告，拒绝
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      )
    }
  }

  /*
  Object.defineProperty(target, key, {
    get: createComputedGetter(key),
    set?: userDef.set || noop
  })
  */
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

/**
 * @createComputedGetter => computedGetter
 * -
 */
function createComputedGetter (key) {
  return function computedGetter () {
    // computedGetter 调用时，是在 vm 的 computed 上，所以 this 指向了 vm 实例
    // 前边 initComputed 的时候，已经有了对应的 watcher
    const watcher = this._computedWatchers && this._computedWatchers[key]

    if (watcher) {
      // dirty 的时候，调用该方法，更新 watcher 的 value，只有第一次走这里，因为会把 dirty 改为 false
      // 之后不再执行 evaluate 而是直接获取 watcher.value
      if (watcher.dirty) {
        watcher.evaluate()
      }
      // 执行依赖收集
      if (Dep.target) {
        watcher.depend()
      }
      // 返回对应的值。
      return watcher.value
    }
  }
}

function createGetterInvoker(fn) {
  return function computedGetter () {
    return fn.call(this, this)
  }
}

/**
 * @initMethods
 * @param {*} vm
 * @param {*} methods
 */
function initMethods (vm: Component, methods: Object) {
  const props = vm.$options.props
  for (const key in methods) {
    if (process.env.NODE_ENV !== 'production') {
      if (typeof methods[key] !== 'function') { // 只能是函数
        warn(
          `Method "${key}" has type "${typeof methods[key]}" in the component definition. ` +
          `Did you reference the function correctly?`,
          vm
        )
      }
      if (props && hasOwn(props, key)) { // 不能和 props 重名
        warn(
          `Method "${key}" has already been defined as a prop.`,
          vm
        )
      }
      if ((key in vm) && isReserved(key)) { // _ 或者 $ 开头，且重名，说明和 vue 定义的方法冲突了。
        warn(
          `Method "${key}" conflicts with an existing Vue instance method. ` +
          `Avoid defining component methods that start with _ or $.`
        )
      }
    }
    // 显示绑定 this 到 vue 实例
    vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm)
  }
}

/**
 * @initWatch
 * - createWatcher
 */
function initWatch (vm: Component, watch: Object) {
  for (const key in watch) {
    const handler = watch[key] // 数组，或者 function | object
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}

function createWatcher (
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: Object
) {
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  if (typeof handler === 'string') {
    // 字符串说明是 vm.methods 的 一个方法，返回的还是一个 function
    handler = vm[handler]
  }
  return vm.$watch(expOrFn, handler, options)
}



/**
 * - 先处理 $data && $props 监听
 * - 定义 $set、$delete、$watch
 */
export function stateMixin (Vue: Class<Component>) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  const dataDef = {}
  dataDef.get = function () { return this._data }
  const propsDef = {}
  propsDef.get = function () { return this._props }
  // if (process.env.NODE_ENV !== 'production') {
  //   dataDef.set = function () {
  //     warn(
  //       'Avoid replacing instance root $data. ' +
  //       'Use nested data properties instead.',
  //       this
  //     )
  //   }
  //   propsDef.set = function () {
  //     warn(`$props is readonly.`, this)
  //   }
  // }
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  Object.defineProperty(Vue.prototype, '$props', propsDef)

  Vue.prototype.$set = set
  Vue.prototype.$delete = del

  Vue.prototype.$watch = function (
    expOrFn: string | Function,
    cb: any,
    options?: Object
  ): Function {
    const vm: Component = this
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {}
    options.user = true
    const watcher = new Watcher(vm, expOrFn, cb, options)
    if (options.immediate) { // 立即执行
      try {
        // 只有一个 value，不存在新旧 value
        cb.call(vm, watcher.value)
      } catch (error) {
        handleError(error, vm, `callback for immediate watcher "${watcher.expression}"`)
      }
    }
    return function unwatchFn () {
      watcher.teardown()
    }
  }
}
