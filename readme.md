# specified-package-version-check

[ENGLISH] | [中文](https://github.com/zhoushoujian/specified-package-version-check/blob/master/readme_zh.md)

## Introduce

specified-package-version-check is a script which can check the specified package version is outdated or not, if outdated, develop env process will be exist.  

For some case, e.g. our team develop ourselves eslint rules as a npm package, if we update the npm package version, we hope all of our team member must use the latest npm version.

## Usage

```js
// Run this script first, e.g. { "start": node check && webpack-dev-server --open --history-api-fallback -d --colors}
//check.js
const checkDependenceVersion = require('specified-package-version-check')

async function func() {
  await checkDependenceVersion({
    dependenceArr: ['axios'],
    ignoreCheck: false,
    onlyWarn: false,
    checkAllLocalDependencies: false
  })
  
  console.log('end');
}

func()

```

## API

| Property                  | Description                                | Type      | Default   | Version       |
| :-----                    | :-----                                     | :-----    | :-----    | :-----        |
| dependenceArr             | dependence need to be checked              | string[]  | []        | 0.0.1         |
| ignoreCheck               | skip check                                 | boolean   | false     | 0.0.1         |
| onlyWarn                  | only warn when specified package outdated  | boolean   | false     | 0.0.1         |
| checkAllLocalDependencies | check all packages version in package.json | boolean   | false     | 0.0.1         |
