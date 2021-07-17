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
    dependenceArr: ['axios', 'specified-package-version-check', '@shuyun-ep-team/eslint-config'],
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

| Property                  | Description                                  | Type     | Default                                                                              | required | Version |
| :------------------------ | :------------------------------------------- | :------- | :----------------------------------------------------------------------------------- | -------- | :------ |
| dependenceArr             | dependence need to be checked                | string[] | []                                                                                   | true     | 1.0.0   |
| ignoreCheck               | skip check                                   | boolean  | false                                                                                | false    | 1.0.0   |
| onlyWarn                  | only warn when specified package outdated    | boolean  | false                                                                                | false    | 1.0.0   |
| checkAllLocalDependencies | check all packages version in package.json   | boolean  | false                                                                                | false    | 1.0.0   |
| ignoreSelf                | ignore check specified-package-version-check | boolean  | false                                                                                | false    | 2.0.0   |
| remoteUrl                 | check specified npm global cli version       | string   | <https://api-track.kylin.shuyun.com/monitor-service/static/global-package-info.json> | false    | 2.0.0   |

false

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
