# babel 

[babel官网地址：https://www.babeljs.cn/docs/](https://www.babeljs.cn/docs/)

## presets 与 plugins

`presets`：作用是为 `babel` 安装指定的插件，插件命名采用 `babel-preset-xxx` 的形式，之后在文件中配置
``` json
{
  "presets": [
    "xxx01",  // 无配置
    ["xxx02", "options"]  // 有配置
  ] 
}
```

执行顺序：
- 先执行完所有 `plugins`，在执行 `presets`
- 多个 `plugins`，按照从前往后的顺序执行
- 多个 `presets`，按照从后往前的顺序执行

## 资料

[学习文章：https://juejin.cn/post/6847902223629090824](https://juejin.cn/post/6847902223629090824)


