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
    dependenceArr: ['axios', 'eslint-config-ts-base'],
    useDepCheck: true,
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

| 属性                      | 描述                                                     | 类型     | 默认值                                                                               | 必填 | 版本  |
| :------------------------ | :------------------------------------------------------- | :------- | :----------------------------------------------------------------------------------- | :--: | ----- |
| dependenceArr             | 需要被检查的依赖                                         | string[] | []                                                                                   |  是  | 0.0.1 |
| ignoreCheck               | 跳过检查                                                 | boolean  | undefined                                                                            |  否  | 0.0.1 |
| onlyWarn                  | 当指定的包过期时只显示警告                               | boolean  | false                                                                                |  否  | 0.0.1 |
| checkAllLocalDependencies | 检查 package.json 里的所有依赖                           | boolean  | undefined                                                                            |  否  | 0.0.1 |
| ignoreSelf                | 忽略检查 @shuyun-ep-team/specified-package-version-check | boolean  | undefined                                                                            |  否  | 1.0.0 |
| remoteUrl                 | 检查 npm 全局 cli 的版本                                 | string   | <https://api-track.kylin.shuyun.com/monitor-service/static/global-package-info.json> |  否  | 1.0.0 |
| uploadPackageInfoUrl      | 上传使用该包的项目信息                                   | string   | <https://api-track.kylin.shuyun.com/monitor-service/upload-package-info>             |  否  | 1.2.1 |
| useDepCheck               | 使用 depcheck 检查项目的冗余依赖和依赖丢失               | boolean  | undefined                                                                            |  否  | 1.2.1 |
| depcheckOptions           | 参考 <https://github.com/depcheck/depcheck#api>          | object   | {}                                                                                   |  否  | 1.2.1 |
| autoFixOutdateDep         | 自动修复指定的过期的包                                   | boolean  | true                                                                                 |  否  | 1.3.0 |
| silent                    | 隐藏输出                                                 | boolean  | false                                                                                |  否  | 1.6.0 |
| enableGlobalCliCheck      | 是否检查指定的 npm 包 全局 cli 版本                      | boolean  | true                                                                                 |  否  | 1.6.0 |

## 关于配置文件

在 package.json 里的 script 标签里写入

```json
{
  "prestart": "npx specified-package-version-check"
}
```

程序会读取当前 package.json 所在目录的.spvrc.js 文件，如果找不到这个文件，控制台会给出一个警告。

```js
//.spvrc.js可参考如下配置
module.exports = {
  dependenceArr: ['eslint-config-ts-base', 'put your deps here...'],
  ignoreCheck: false,
  onlyWarn: false,
  checkAllLocalDependencies: false,
  useDepCheck: true,
  autoFixOutdateDep: true,
};
```

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
