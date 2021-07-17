const axios = require('axios');
const { exec } = require('child_process');
const semver = require('semver');
const { name } = require('../package.json');
require('console-format');

interface IConfig {
  dependenceArr: string[];
  ignoreCheck?: boolean;
  onlyWarn?: boolean;
  checkAllLocalDependencies?: boolean;
  ignoreSelf?: boolean;
  remoteUrl?: string;
}

function getNpmCurrentVersion(packageJsonName: string) {
  console.info('package', packageJsonName);
  return axios
    .get(`http://npm.kylin.shuyun.com/${packageJsonName}`)
    .then(function (res: any) {
      return res.data['dist-tags'].latest;
    })
    .catch(function (err: any) {
      console.error(name, ' :getNpmCurrentVersion err', err.stack || err.toString());
      throw err;
    });
}

function fetchGlobalPackageCliNames(remoteUrl: string) {
  return axios
    .get(remoteUrl || 'https://api-track.kylin.shuyun.com/monitor-service/static/global-package-info.json')
    .then((res: any) => {
      return res.data;
    })
    .catch((err: any) => {
      console.warn(name, ' :fetchGlobalPackageNames err', err.stack || err.toString());
      return {};
    });
}

interface IOutdatePackageInfo {
  name?: string;
  localVersion?: string;
  remoteVersion?: string;
  note?: string;
  err?: string;
}

function loadPackageInfo(outdatePackageInfo: IOutdatePackageInfo[], packageName: string, globalVersion: string) {
  let packageInfo: any = {};
  if (!globalVersion) {
    try {
      packageInfo = require(`${packageName}/package.json`);
    } catch (err) {
      if (!globalVersion) {
        outdatePackageInfo.push({
          name: packageName,
          err: err.stack || err.toString(),
        });
      }
    }
  }
  if (packageInfo || globalVersion) {
    const localVersion = globalVersion || packageInfo.version;
    return getNpmCurrentVersion(packageName)
      .then((remoteVersion: string) => {
        if (semver.gt(remoteVersion, localVersion)) {
          outdatePackageInfo.push({
            name: packageName,
            localVersion,
            remoteVersion,
            note: globalVersion ? `Global ${packageName} version has expired，please upgrade` : '',
          });
        } else {
          console.info(
            `${packageName} => ${
              globalVersion ? 'globalVersion' : 'localVersion'
            } :${localVersion} => remoteVersion:${remoteVersion} => latest`,
          );
        }
      })
      .catch((err: any) => {
        outdatePackageInfo.push({
          name: packageName,
          localVersion,
          remoteVersion: 'unknown',
          note: globalVersion ? 'global' : 'local',
          err: err.stack || err.toString(),
        });
      });
  } else {
    return Promise.resolve();
  }
}

//@ts-ignore
async function checkDependenceVersion(config: IConfig) {
  let checkDependenceVersionArr: string[] = [name],
    onlyWarn = false;
  const outdatePackageInfo: IOutdatePackageInfo[] = [];
  if (Object.prototype.toString.call(config) === '[object Object]') {
    const { ignoreCheck, onlyWarn: onlyWarnInConfig, checkAllLocalDependencies } = config;
    if (!Array.isArray(config.dependenceArr)) {
      config.dependenceArr = [];
    }
    checkDependenceVersionArr = [...new Set(config.dependenceArr), name];
    if (ignoreCheck) {
      console.info('npm package version check has been ignored');
      return Promise.resolve(config);
    }
    if (onlyWarnInConfig) {
      onlyWarn = onlyWarnInConfig;
    }
    if (checkAllLocalDependencies) {
      console.info('checking all local dependencies...');
      const result: string[] = [];
      return new Promise(res => {
        const child = exec('npm outdate');
        child.stdout?.on('data', function (data: string) {
          if (onlyWarn) {
            console.warn(name, ' :outdate packages: ', data);
          } else {
            console.error(name, ' :outdate packages: ', data);
          }
          result.push(data);
        });
        child.stderr?.on('data', function (data: string) {
          console.warn(name, ' :outdate: ', data);
        });
        child.on('exit', function (code: number) {
          console.info('check all local dependencies finished! ', code);
          if (result.length && !onlyWarn) {
            process.exit(1);
          }
          res(0);
        });
      });
    }
  }
  console.debug('checking global dependence...');
  const result = await fetchGlobalPackageCliNames(config.remoteUrl || '');
  if (Array.isArray(result.info)) {
    await Promise.all(
      result.info.map((item: { command: string; name: string }) => {
        return new Promise(res => {
          let finished = false;
          const child = exec(item.command);
          child.stdout?.on('data', async function (data: string) {
            data = data.replace('\n', '').replace('\r', '');
            await loadPackageInfo(outdatePackageInfo, item.name, data);
            finished = true;
            res(0);
          });
          child.stderr?.on('data', function () {
            // command execute fail
            // console.warn('npm global cli stderr: ', data);
            finished = true;
          });
          child.on('exit', function () {
            if (finished) {
              res(0);
            }
          });
        });
      }),
    );
  } else {
    console.warn(name, ' :info is not an array, read readme.md carefully');
  }
  console.debug('checking local dependence...');
  await Promise.all(
    checkDependenceVersionArr
      .filter(item => {
        if (config.ignoreSelf) {
          return item !== name;
        } else {
          return true;
        }
      })
      .map(packageName => loadPackageInfo(outdatePackageInfo, packageName, '')),
  ).then(() => {
    if (outdatePackageInfo.length) {
      if (onlyWarn) {
        console.warn(name, ' :following packages are outdated: ', outdatePackageInfo);
      } else {
        console.error(name, ' :following packages are outdated: ', outdatePackageInfo);
        process.exit(1);
      }
    } else {
      console.info(name, ' :all dependencies check success!');
      return config;
    }
  });
  return outdatePackageInfo;
}

module.exports = checkDependenceVersion;
