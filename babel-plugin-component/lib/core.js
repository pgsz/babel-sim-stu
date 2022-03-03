// 判断 obj 的类型
function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }
  return _typeof(obj);
}

// 提供一些方法，负责生成 import 节点
var _require = require('@babel/helper-module-imports'),
  addSideEffect = _require.addSideEffect,
  addDefault = _require.addDefault;

  // node.js 的内置模块，处理路径信息
var resolve = require('path').resolve;

// node.js 的内置模块，判断文件是否存在
var isExist = require('fs').existsSync;

// 缓存变量
var cache = {};
// 缓存样式库的样式路径
var cachePath = {};
var importAll = {};

module.exports = function core(defaultLibraryName) {
  return function (_ref) {
    var types = _ref.types;
    var specified;
    // 存储所有全局引入的库
    var selectedMethods;
    // 引入的模块与库之间的对应关系
    var moduleArr;

    // 将驼峰命名转换成连字符命名，如：'TestText' => 'test-text'
    function parseName(_str, camel2Dash) {
      if (!camel2Dash) {
        return _str;
      }

      // 将首字母变为小写 'TestText' => 'testText'
      var str = _str[0].toLowerCase() + _str.substr(1);

      // 全局匹配 A-Z 中的大写字母
      return str.replace(/([A-Z])/g, function ($1) {
        // $1：与 regexp 中的第一个子表达式相匹配的文本  'testText'中 'T'
        return "-".concat($1.toLowerCase());
      });
    }

    /**
     * 该方法负责生成一些 AST 节点，这些节点信息根据一些配置项来的
     * 这些配置项就是在告诉 AST 节点每个组件的路径信息
     * @param {*} methodName: Button
     * @param {*} file: 节点信息
     * @param {*} opts: 配置项
    */
    function importMethod(methodName, file, opts) {
      if (!selectedMethods[methodName]) {
        var options;
        var path;

        if (Array.isArray(opts)) {
          options = opts.find(function (option) {
            return moduleArr[methodName] === option.libraryName || libraryObjs[methodName] === option.libraryName;
          }); // eslint-disable-line
        }

        // 传递进来的配置项
        options = options || opts;
        var _options = options,
        //  配置的 libDir
          _options$libDir = _options.libDir,
          // 没有配置，就默认为 lib， /element-ui/lib/button.js 中的 lib 路径来源
          libDir = _options$libDir === void 0 ? 'lib' : _options$libDir,
          // 组件库名称 element-ui
          _options$libraryName = _options.libraryName,
          // 组件库名称
          libraryName = _options$libraryName === void 0 ? defaultLibraryName : _options$libraryName,
          // 样式，Boolean 类型
          _options$style = _options.style,
          // style 默认为 true，可以由用户提供，在用户没有提供 styleLibraryName 选项时起作用
          style = _options$style === void 0 ? true : _options$style,
          styleLibrary = _options.styleLibrary,
          _options$root = _options.root,
          root = _options$root === void 0 ? '' : _options$root,
          _options$camel2Dash = _options.camel2Dash,
          camel2Dash = _options$camel2Dash === void 0 ? true : _options$camel2Dash;
          // 配置项中 'theme-chalk'
        var styleLibraryName = options.styleLibraryName;

        var _root = root;
        var isBaseStyle = true;
        var modulePathTpl;
        var styleRoot;
        var mixin = false;
        // 后缀 xx.css
        var ext = options.ext || '.css';

        if (root) {
          _root = "/".concat(root);
        }

        if (libraryObjs[methodName]) {
          // 默认导出 ElementUI, path = 'element-ui/lib'
          path = "".concat(libraryName, "/").concat(libDir).concat(_root);

          if (!_root) {
            // 默认情况下，记录在importAll 中标记 path 为 true
            importAll[path] = true;
          }
        } else {
          // 按需加载 pth = 'element-ui/lin/button'
          path = "".concat(libraryName, "/").concat(libDir, "/").concat(parseName(methodName, camel2Dash));
        }

        // element-ui/lin/button
        var _path = path;
        selectedMethods[methodName] = addDefault(file.path, path, {
          nameHint: methodName
        });

        // 处理样式
        if (styleLibrary && _typeof(styleLibrary) === 'object') {
          styleLibraryName = styleLibrary.name;
          isBaseStyle = styleLibrary.base;
          modulePathTpl = styleLibrary.path;
          mixin = styleLibrary.mixin;
          styleRoot = styleLibrary.root;
        }

        // 默认没有配置 走入 else 逻辑
        if (styleLibraryName) {
          // 缓存样式库路径
          if (!cachePath[libraryName]) {
            var themeName = styleLibraryName.replace(/^~/, '');
            // cachePath['element-ui'] = 'element-ui/lib/theme-chalk'
            cachePath[libraryName] = styleLibraryName.indexOf('~') === 0 ? resolve(process.cwd(), themeName) : "".concat(libraryName, "/").concat(libDir, "/").concat(themeName);
          }

          if (libraryObjs[methodName]) {
            // 默认导出
            /* istanbul ingore next */
            if (cache[libraryName] === 2) {
              // 提示信息：如果项目中既存在默认导入，又存在按需加载，则要保证默认导入在按需加载的前面
              throw Error('[babel-plugin-component] If you are using both' + 'on-demand and importing all, make sure to invoke the' + ' importing all first.');
            }

            if (styleRoot) {
              path = "".concat(cachePath[libraryName]).concat(styleRoot).concat(ext);
            } else {
              // 默认导出样式库路径：path = 'element-ui/lib/theme-chalk/index.css'
              path = "".concat(cachePath[libraryName]).concat(_root || '/index').concat(ext);
            }

            cache[libraryName] = 1;
          } else {
            // 按需引入 !== 1 存在默认导入 和 按需引入的 情况，一般很少见
            if (cache[libraryName] !== 1) {
              /* if set styleLibrary.path(format: [module]/module.css) */
              var parsedMethodName = parseName(methodName, camel2Dash);

              if (modulePathTpl) {
                var modulePath = modulePathTpl.replace(/\[module]/ig, parsedMethodName);
                path = "".concat(cachePath[libraryName], "/").concat(modulePath);
              } else {
                path = "".concat(cachePath[libraryName], "/").concat(parsedMethodName).concat(ext);
              }

              if (mixin && !isExist(path)) {
                path = style === true ? "".concat(_path, "/style").concat(ext) : "".concat(_path, "/").concat(style);
              }

              if (isBaseStyle) {
                addSideEffect(file.path, "".concat(cachePath[libraryName], "/base").concat(ext));
              }

              cache[libraryName] = 2;
            }
          }

          addDefault(file.path, path, {
            nameHint: methodName
          });
        } else {
          if (style === true) {
            // 'element-ui/style.css' ext 默认为 .css，可以由用户提供
            addSideEffect(file.path, "".concat(path, "/style").concat(ext));
          } else if (style) {
            // 'element-ui/xxx' style 由用户提供
            addSideEffect(file.path, "".concat(path, "/").concat(style));
          }
        }
      }

      return selectedMethods[methodName];
    }

    function buildExpressionHandler(node, props, path, state) {
      var file = path && path.hub && path.hub.file || state && state.file;
      props.forEach(function (prop) {
        if (!types.isIdentifier(node[prop])) return;

        if (specified[node[prop].name]) {
          node[prop] = importMethod(node[prop].name, file, state.opts); // eslint-disable-line
        }
      });
    }

    function buildDeclaratorHandler(node, prop, path, state) {
      var file = path && path.hub && path.hub.file || state && state.file;
      if (!types.isIdentifier(node[prop])) return;

      if (specified[node[prop].name]) {
        node[prop] = importMethod(node[prop].name, file, state.opts); // eslint-disable-line
      }
    }

    // 具体类型可查看 https://www.babeljs.cn/docs/babel-types
    return {
      // 整个查询的入口
      visitor: {
        // 负责处理 AST 中的 Program 节点类型
        Program: function Program() {
          // 将之前定的几个变量初始化为没有原型链的对象
          specified = Object.create(null);
          libraryObjs = Object.create(null);
          selectedMethods = Object.create(null);
          moduleArr = Object.create(null);
        },
        // 负责处理 ImportDeclaration 节点
        ImportDeclaration: function ImportDeclaration(path, _ref2) {
          // 配置项
          var opts = _ref2.opts;
          // import xx from 'xx' 节点
          var node = path.node;
          // import xx from 'element-ui' value：库名称
          var value = node.source.value;
          var result = {};

          // 配置项如果是个数组
          if (Array.isArray(opts)) {
            result = opts.find(function (option) {
              return option.libraryName === value;
            }) || {};
          }

          // 库名称
          var libraryName = result.libraryName || opts.libraryName || defaultLibraryName;

          // 如果当前 import 的库就是我们需要处理的库
          if (value === libraryName) {
            // node.specifiers 存放多个 ImportDeclaration，都是引入的组件
            node.specifiers.forEach(function (spec) {
              // 按需引入走此逻辑： ImportSpecifier 是按需引入
              if (types.isImportSpecifier(spec)) {
                // 设置按需引入的组件
                specified[spec.local.name] = spec.imported.name;
                // 记录当前组件是从哪个库引入，如 moduleArr['Button'] = 'element-ui'
                moduleArr[spec.imported.name] = value;
              } else {
                // 默认导入 libraryObjs['ElementUI'] = 'element-ui'
                libraryObjs[spec.local.name] = value;
              }
            });

            // 不是全局引入就删掉该节点，就是删除所有的按需引入
            if (!importAll[value]) {
              path.remove();
            }
          }
        },
        /**
         * 生成所需要的格式
         * 使用按需加载的时，如果只是 import 引入，但没有使用 Vue.use(xxx) 则不会打包进去
         * 
         * 默认导入
         * {
         *   type: 'CallExpression',
         *   callee: { type: 'Identifier', name: 'require' },
         *   arguments: [ { type: 'StringLiteral', value: 'element-ui/lib' } ]
         * }   
         * {
         *    callee: { type: 'Identifier', name: 'require' },
         *    arguments: [
         *      {
         *        type: 'StringLiteral',
         *        value: 'element-ui/lib/theme-chalk/index.css'
         *      }
         *    ]
         * }
         * 
         * 按需加载
         * {
         *   type: 'CallExpression',
         *   callee: { type: 'Identifier', name: 'require' },
         *   arguments: [ { type: 'StringLiteral', value: 'element-ui/lib/button' } ]
         * }
        */
        CallExpression: function CallExpression(path, state) {
          var node = path.node;
          var file = path && path.hub && path.hub.file || state && state.file;
          var name = node.callee.name;

          // console.log(node)

          // 判断 node.callee 是否是 Identifier,
          if (types.isIdentifier(node.callee)) {
            if (specified[name]) {
              node.callee = importMethod(specified[name], file, state.opts);
            }
          } else {
            // 解析 node.arguments 数组，每个元素都是一个 Identifier，Vue.use 或 Vue.component 的参数
            node.arguments = node.arguments.map(function (arg) {
              // 参数名称
              var argName = arg.name;

              // 生成新的 Identifier，并更改 AST 节点的属性值，按需导入还是默认导入是在 ImportDeclaration 中觉决定的
              if (specified[argName]) {
                // 按需引入 { type: 'Identifier', name: '_Button' }
                // console.log(importMethod(specified[argName], file, state.opts))
                return importMethod(specified[argName], file, state.opts);
              } else if (libraryObjs[argName]) {
                // 默认导入 { type: 'Identifier', name: '_ElementUI' }
                // console.log(importMethod(argName, file, state.opts))
                return importMethod(argName, file, state.opts);
              }

              return arg;
            });
          }
        },
        // MemberExpression 类型，更改 node.object 对象
        MemberExpression: function MemberExpression(path, state) {
          var node = path.node;
          var file = path && path.hub && path.hub.file || state && state.file;

          if (libraryObjs[node.object.name] || specified[node.object.name]) {
            node.object = importMethod(node.object.name, file, state.opts);
          }
        },
        // 处理赋值表达式
        AssignmentExpression: function AssignmentExpression(path, _ref3) {
          var opts = _ref3.opts;

          if (!path.hub) {
            return;
          }

          var node = path.node;
          var file = path.hub.file;
          if (node.operator !== '=') return;

          if (libraryObjs[node.right.name] || specified[node.right.name]) {
            node.right = importMethod(node.right.name, file, opts);
          }
        },
        // 处理数组表达式
        ArrayExpression: function ArrayExpression(path, _ref4) {
          var opts = _ref4.opts;

          if (!path.hub) {
            return;
          }

          var elements = path.node.elements;
          var file = path.hub.file;
          elements.forEach(function (item, key) {
            if (item && (libraryObjs[item.name] || specified[item.name])) {
              elements[key] = importMethod(item.name, file, opts);
            }
          });
        },
        // 属性
        Property: function Property(path, state) {
          var node = path.node;
          buildDeclaratorHandler(node, 'value', path, state);
        },
        // 变量声明
        VariableDeclarator: function VariableDeclarator(path, state) {
          var node = path.node;
          buildDeclaratorHandler(node, 'init', path, state);
        },
        // 逻辑表达式
        LogicalExpression: function LogicalExpression(path, state) {
          var node = path.node;
          buildExpressionHandler(node, ['left', 'right'], path, state);
        },
        // 条件表达式
        ConditionalExpression: function ConditionalExpression(path, state) {
          var node = path.node;
          buildExpressionHandler(node, ['test', 'consequent', 'alternate'], path, state);
        },
        // if 语句
        IfStatement: function IfStatement(path, state) {
          var node = path.node;
          buildExpressionHandler(node, ['test'], path, state);
          buildExpressionHandler(node.test, ['left', 'right'], path, state);
        }
      }
    };
  };
};