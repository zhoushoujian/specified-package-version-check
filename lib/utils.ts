import * as os from 'os';
import axios from 'axios';
import * as path from 'path';
import * as semver from 'semver';
import * as ErrorStackParser from 'error-stack-parser';

interface IDealWithFilePathParam {
  showFullFilePath?: boolean;
}
const hasProcessObject = typeof process !== 'undefined';
export const isNodejs = hasProcessObject && typeof global !== 'undefined';
export const hostname = os.hostname && os.hostname(); //charms-Mac-Pro.local
const homedir = os.homedir && os.homedir(); ///Users/charm
const platform = os.platform && os.platform(); //darwin
const osType = os.type && os.type(); //Darwin
//Darwin Kernel Version 16.7.0: Thu Jun 15 17:36:27 PDT 2017; root:xnu-3789.70.16~2/RELEASE_X86_64
const osVersion = os.version && os.version();
const totalmem = os.totalmem && os.totalmem();
const cpus = os.cpus && os.cpus();
const pwd = hasProcessObject && process.cwd && process.cwd();
const nodeVersion = hasProcessObject && process.version;

let address: string = '';
if (os.networkInterfaces) {
  const networks = os.networkInterfaces() as any;
  Object.keys(networks).forEach(function (k) {
    for (const kk in networks[k]) {
      if (networks[k][kk].family === 'IPv4' && networks[k][kk].address !== '127.0.0.1') {
        address = networks[k][kk].address;
      }
    }
  });
}

//格式化时间
export const getTime = () => {
  const year = new Date().getFullYear();
  let month: string | number = new Date().getMonth() + 1;
  let day: string | number = new Date().getDate();
  let hour: string | number = new Date().getHours();
  let minute: string | number = new Date().getMinutes();
  let second: string | number = new Date().getSeconds();
  let mileSecond: string | number = new Date().getMilliseconds();
  if (month < 10) {
    month = '0' + month;
  }
  if (day < 10) {
    day = '0' + day;
  }
  if (hour < 10) {
    hour = '0' + hour;
  }
  if (minute < 10) {
    minute = '0' + minute;
  }
  if (second < 10) {
    second = '0' + second;
  }
  if (mileSecond < 10) {
    mileSecond = '00' + mileSecond;
  } else if (mileSecond < 100) {
    mileSecond = '0' + mileSecond;
  }
  const time = `${year}-${month}-${day} ${hour}:${minute}:${second}.${mileSecond}`;
  return time;
};

//获取当前项目的根目录
export const slash = path.sep;
export const getProjectFolder = () => {
  //使用process.cwd()在vscode插件的环境里可能获取不到正确的项目地址
  let currentFolder = typeof __dirname !== 'undefined' ? __dirname : hasProcessObject ? process.cwd() : '';
  if (process.env.VERSION_CHECK_ENV === 'test') {
    currentFolder = process.cwd();
  }
  const pwd = currentFolder.split('node_modules')[0];
  const path = ['/', '\\'].includes(pwd[pwd.length - 1]) ? pwd : pwd + slash;
  return path;
};

//获取作用代码所在的路径
export const dealWithFilePath = (params: IDealWithFilePathParam = {}) => {
  const { showFullFilePath = false } = params;
  let filePath = 'node_modules';
  const err = new Error('error');
  const error: any[] = ErrorStackParser.parse(err);
  error.some((item) => {
    if (
      item.fileName &&
      !/^internal.+/.test(item.fileName) &&
      !/node_modules/.test(item.fileName) &&
      !['net.js', 'events.js', 'domain.js', 'async_hooks.js'].includes(item.fileName) &&
      !item.fileName.includes('console-format') &&
      !item.fileName.includes('node:internal/')
    ) {
      filePath = item.fileName + ':' + item.lineNumber;
      if (isNodejs && !showFullFilePath) {
        const pwd = getProjectFolder();
        if (item.fileName !== pwd && item.fileName.includes(pwd)) {
          filePath = filePath.replace(pwd, '');
        }
      }
      return true;
    } else {
      return false;
    }
  });
  if (filePath === 'node_modules') {
    error.some((item) => {
      if (
        item.fileName.includes('node_modules') &&
        !item.fileName.includes('specified-package-version-check') &&
        !item.fileName.includes('node:internal/') &&
        !['Object.debug', 'Object.log', 'Object.info', 'Object.warn', 'Object.error'].includes(item.functionName)
      ) {
        filePath = 'node_modules' + item.fileName.split('node_modules')[1] + ':' + item.lineNumber;
        return true;
      } else {
        return false;
      }
    });
  }
  return filePath;
};

export function getNpmCurrentVersion(packageJsonName: string) {
  return axios
    .get(`https://registry.npmmirror.com/${packageJsonName}`)
    .then(function (res: any) {
      return res.data['dist-tags'].latest;
    })
    .catch(function (err: Error) {
      throw err;
    });
}

//获取远程package的最新版本
export const comparePackageVersion = (packageName: string, localVersion: string) => {
  return getNpmCurrentVersion(packageName)
    .then((remoteVersion: string) => {
      if (semver.gt(remoteVersion, localVersion)) {
        return {
          result: true,
          remoteVersion,
          error: null,
        };
      } else {
        return {
          result: false,
          remoteVersion,
          error: null,
        };
      }
    })
    .catch((err: Error) => {
      return {
        result: false,
        remoteVersion: '',
        error: err,
      };
    });
};

export const uploadPackageInfo = (name: string, version: string, uploadPackageInfoUrl: string | null) => {
  if (uploadPackageInfoUrl) {
    let packageInfo: any = {};
    try {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      packageInfo = require(`${getProjectFolder()}package.json`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(name, ': require err', err);
    }
    axios
      .post(uploadPackageInfoUrl, {
        ...packageInfo,
        packageName: name,
        packageVersion: version,
        address,
        hostname,
        homedir,
        platform,
        osType,
        osVersion,
        totalmem,
        cpus,
        pwd,
        nodeVersion,
      })
      .catch((err: Error) => {
        // eslint-disable-next-line no-console
        console.warn(name + ': upload package-version-info error', err.stack);
      });
  }
};
