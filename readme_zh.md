# specified-package-version-check

[中文] | [ENGLISH](https://github.com/zhoushoujian/specified-package-version-check)

## 介绍

specified-package-version-check 是一个可以检查指定的包版本是否过期的脚本，假如包已过期，开发环境的进程将会被退出。

对于一些场景，比如，我们的团队开发了我们自己的 eslint 规则作为一个 npm 包，假如我们更新了 npm 包版本，我们希望我们团队的所有成员都必须使用最新的 npm 版本。

## 使用

```js
// 先运行这个脚本，比如. { "start": node check && webpack-dev-server --open --history-api-fallback -d --colors}
//check.js
const checkDependenceVersion = require('specified-package-version-check');

async function checkDependencies() {
  await checkDependenceVersion({
    dependenceArr: ['axios', 'specified-package-version-check', '@shuyun-ep-team/eslint-config'],
    ignoreCheck: false,
    onlyWarn: false,
    checkAllLocalDependencies: false,
    ignoreSelf: false,
    remoteUrl: '',
  });
}

checkDependencies();
```

## API

| 属性                      | 描述                                     | 类型     | 默认值                                                                               | 必填 | 版本  |
| :------------------------ | :--------------------------------------- | :------- | :----------------------------------------------------------------------------------- | :--: | ----- |
| dependenceArr             | 需要被检查的依赖                         | string[] | []                                                                                   |  是  | 0.0.1 |
| ignoreCheck               | 跳过检查                                 | boolean  | false                                                                                |  否  | 0.0.1 |
| onlyWarn                  | 当指定的包过期时只显示警告               | boolean  | false                                                                                |  否  | 0.0.1 |
| checkAllLocalDependencies | 检查 package.json 里的所有依赖           | boolean  | false                                                                                |  否  | 0.0.1 |
| ignoreSelf                | 忽略检查 specified-package-version-check | boolean  | false                                                                                |  否  | 2.0.0 |
| remoteUrl                 | 检查 npm 全局 cli 的版本                 | string   | <https://api-track.kylin.shuyun.com/monitor-service/static/global-package-info.json> |  否  | 2.0.0 |

## 关于 remoteUrl 里的 json 文件格式

`返回的json内容格式必须像下面这样`

```json
{
  "info": [
    {
      "command": "显示版本的命令", //e.g. yarn -v
      "name": "包名称" //e.g. yarn
    }
  ]
}
```
