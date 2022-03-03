// 接收当前 Babel 对象作为参数的 Function
module.exports = function(babel){
  // 固定：返回一个有 visitor 的对象，visitor 属性是主要访问者
  return {
    visitor: {
      /**
       * 负责处理节点类型为 Identifier 的 AST 节点
       * path：AST 节点的路径信息
       * state：有个重要属性 opts，也就是 babelrc 中的配置项
      */
      Identifier(path,state) {
        // 节点信息
        const node = path.node
        // 拿到 name 属性，即 a 和 b
        const name = node.name
        // 如果配置项中存在 name 属性，将值替换
        if(state.opts[name]){
          path.node.name = state.opts[name]
        }
      },
      // 处理变量声明关键字
      VariableDeclaration(path, state){
        const node = path.node
        if(node.kind === 'let'){
          node.kind = 'const'
        }
      }
    }
  }
}