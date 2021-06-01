# specified-package-version-check

[中文] | [ENGLISH](https://gitlab.shuyun.com/front-end-engineering1/enterprise-stores/shuyun-ep-team/specified-package-version-check/blob/master/readme.md)

## 介绍

specified-package-version-check是一个可以检查指定的包版本是否过期的脚本，假如包已过期，开发环境的进程将会被退出。  

对于一些场景，比如，我们的团队开发了我们自己的eslint规则作为一个npm包，假如我们更新了npm包版本，我们希望我们团队的所有成员都必须使用最新的npm版本。  

## 使用

```js
// 先运行这个脚本，比如. { "start": node check && webpack-dev-server --open --history-api-fallback -d --colors}
//check.js
const checkDependenceVersion = require('specified-package-version-check')

async function checkDependencies() {
  await checkDependenceVersion({
    dependenceArr: ['axios', 'specified-package-version-check', '@shuyun-ep-team/eslint-config'],
    ignoreCheck: false,
    onlyWarn: false,
    checkAllLocalDependencies: false
  })
}

checkDependencies()

```

## API

| 属性                      | 描述                          | 类型       | 默认值     | 版本       |
| :-----                    | :-----                       | :-----     | :-----    | :-----        |
| dependenceArr             | 需要被检查的依赖               | string[]  | []        | 0.0.1         |
| ignoreCheck               | 跳过检查                      | boolean   | false     | 0.0.1         |
| onlyWarn                  | 当指定的包过期时只显示警告      | boolean   | false     | 0.0.1         |
| checkAllLocalDependencies | 检查package.json里的所有依赖   | boolean   | false     | 0.0.1         |
