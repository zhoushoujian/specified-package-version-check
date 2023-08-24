# specified-package-version-check

[ENGLISH] | [中文](https://github.com/zhoushoujian/specified-package-version-check/blob/master/readme_zh.md)

## Introduce

specified-package-version-check is a script which can check the specified package version is outdated or not, if outdated, develop env process will be exist.

For some case, e.g. our team develop ourselves eslint rules as a npm package, if we update the npm package version, we hope all of our team member must use the latest npm version.

## Usage

```js
// Run this script first, e.g. { "start": node check && webpack-dev-server --open --history-api-fallback -d --colors}
//check.js
const checkDependenceVersion = require('specified-package-version-check');

async function func() {
  await checkDependenceVersion({
    dependenceArr: ['axios', 'eslint-config-ts-base'],
    useDepCheck: true,
    ignoreCheck: false,
    onlyWarn: false,
    checkAllLocalDependencies: false,
    ignoreSelf: false,
    remoteUrl: '',
  });

  console.log('end');
}

func();
```

## API

| Property                  | Description                                                      | Type     | Default                                                                              | required | Version |
| :------------------------ | :--------------------------------------------------------------- | :------- | :----------------------------------------------------------------------------------- | -------- | :------ |
| dependenceArr             | dependence need to be checked                                    | string[] | []                                                                                   | true     | 1.0.0   |
| ignoreCheck               | skip check                                                       | boolean  | undefined                                                                            | false    | 1.0.0   |
| onlyWarn                  | only warn when specified package outdated                        | boolean  | false                                                                                | false    | 1.0.0   |
| checkAllLocalDependencies | check all packages version in package.json                       | boolean  | undefined                                                                            | false    | 1.0.0   |
| ignoreSelf                | ignore check @shuyun-ep-team/specified-package-version-check     | boolean  | undefined                                                                            | false    | 1.0.0   |
| remoteUrl                 | check specified npm global cli version                           | string   | <https://api-track.kylin.shuyun.com/monitor-service/static/global-package-info.json> | false    | 1.0.0   |
| uploadPackageInfoUrl      | upload package info                                              | string   | <https://api-track.kylin.shuyun.com/monitor-service/upload-package-info>             | false    | 1.2.1   |
| useDepCheck               | use depcheck to check useless dependencies and miss dependencies | boolean  | undefined                                                                            | false    | 1.2.1   |
| depcheckOptions           | refer to <https://github.com/depcheck/depcheck#api>              | object   | {}                                                                                   | false    | 1.2.1   |
| autoFixOutdateDep         | auto fix outdate specified package                               | boolean  | true                                                                                 | false    | 1.3.0   |
| silent                    | hide output                                                      | boolean  | false                                                                                | false    | 1.6.0   |
| enableGlobalCliCheck      | check specified global npm package cli version                   | boolean  | true                                                                                 | false    | 1.6.0   |

## 关于配置文件

Insert the following into script in package.json

```json
{
  "prestart": "npx specified-package-version-check"
}
```

Command will read current folder's .spvrc.js where package.json is, if not found that file, console would happen an error

```js
//.spvrc.js like as follows
module.exports = {
  dependenceArr: ['eslint-config-ts-base', 'put your deps here...'],
  ignoreCheck: false,
  onlyWarn: false,
  checkAllLocalDependencies: false,
  useDepCheck: true,
  autoFixOutdateDep: true,
};
```

## something about remoteUrl json

`json content construct must be as following`

```json
{
  "info": [
    {
      "command": "show version command", //e.g. yarn -v
      "name": "package name" //e.g. yarn
    }
  ]
}
```
