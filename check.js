/* eslint-disable import/no-dynamic-require */
const axios = require('axios');
const { exec } = require('child_process');

const logger = {};
const colors = {
  Reset: '\x1b[0m',
  FgRed: '\x1b[31m',
  FgGreen: '\x1b[32m',
  FgYellow: '\x1b[33m',
  FgBlue: '\x1b[34m',
};
const logFunc = function (...args) {
  console.log(...args);
};
'debug:debug:FgBlue,info:info:FgGreen,warn:warn:FgYellow,error:error:FgRed,log:log:FgGreen'
  .split(',')
  .forEach(function (logColor) {
    const [log, info, color] = logColor.split(':');
    logger[log] = function (...args) {
      // eslint-disable-next-line no-useless-call
      logFunc.apply(null, [
        `${colors[color]}[${getTime()}] [${info.toUpperCase()}] [${process.pid}] [specified-package-version-check] ${
          colors.Reset
        } `,
        ...args,
        colors.Reset,
      ]);
    };
  });

function getNpmCurrentVersion(packageJsonName) {
  logger.info('package', packageJsonName);
  return axios
    .get(`http://npm.kylin.shuyun.com/${packageJsonName}`)
    .then(function (res) {
      return res.data['dist-tags'].latest;
    })
    .catch(function (err) {
      logger.error('getNpmCurrentVersion err', err.stack || err.toString());
      throw err;
    });
}

function fetchGlobalPackageCliNames() {
  return axios
    .get('http://aaa')
    .then(res => {
      return JSON.parse(res.data);
    })
    .catch(err => {
      logger.warn('fetchGlobalPackageNames err', err);
    });
}

function loadPackageInfo(outdatePackageInfo, packageName, isGlobal) {
  return new Promise(res => {
    let packageInfo = null;
    try {
      // eslint-disable-next-line global-require
      packageInfo = require(`${packageName}/package.json`);
    } catch (err) {
      if (!isGlobal) {
        outdatePackageInfo.push({
          name: packageName,
          err,
        });
      }
    }
    if (packageInfo) {
      const localVersion = packageInfo.version;
      return getNpmCurrentVersion(packageName)
        .then(remoteVersion => {
          if (remoteVersion > localVersion) {
            outdatePackageInfo.push({
              name: packageName,
              localVersion,
              remoteVersion,
              note: isGlobal ? `全局${packageName}CLI版本已过期，请升级` : '',
            });
          } else {
            logger.info(
              `${packageName} => ${
                isGlobal ? 'globalVersion' : 'localVersion'
              } :${localVersion} => remoteVersion:${remoteVersion} => latest`,
            );
          }
          res();
        })
        .catch(err => {
          outdatePackageInfo.push({
            name: packageName,
            localVersion,
            remoteVersion: '未知',
            note: isGlobal ? 'global' : 'local',
            err,
          });
          res();
        });
    } else {
      res();
    }
  });
}

async function checkDependenceVersion(config) {
  let checkDependenceVersionArr = [],
    onlyWarn = false;
  const outdatePackageInfo = [];
  if (Object.prototype.toString.call(config) === '[object Object]') {
    const { ignoreCheck, onlyWarn: onlyWarnInConfig, checkAllLocalDependencies } = config;
    if (!Array.isArray(config.dependenceArr)) {
      config.dependenceArr = [];
    }
    checkDependenceVersionArr = [...new Set(config.dependenceArr)];
    if (ignoreCheck) {
      logger.info('npm package version check has been ignored');
      return Promise.resolve(config);
    }
    if (onlyWarnInConfig) {
      onlyWarn = onlyWarnInConfig;
    }
    if (checkAllLocalDependencies) {
      logger.info('checking all local dependencies...');
      const result = [];
      return new Promise(res => {
        const child = exec('npm outdate');
        child.stdout.on('data', function (data) {
          if (onlyWarn) {
            logger.warn('outdate packages: ', data);
          } else {
            logger.error('outdate packages: ', data);
          }
          result.push(data);
        });
        child.stderr.on('data', function (data) {
          logger.warn('outdate: ', data);
        });
        child.on('exit', function (code) {
          logger.info('check all local dependencies finished! ', code);
          if (result.length && !onlyWarn) {
            process.exit(1);
          }
          res();
        });
      });
    }
  }
  if (!checkDependenceVersionArr.length) {
    logger.warn('no local dependence will be checked!');
  } else {
    logger.info('checking dependence...');
  }
  await fetchGlobalPackageCliNames().then(async result => {
    if (result && Array.isArray(result.packages)) {
      for (const packageName of result.packages) {
        // eslint-disable-next-line no-await-in-loop
        await loadPackageInfo(outdatePackageInfo, packageName, true);
      }
    }
  });
  return Promise.all(
    checkDependenceVersionArr.map(packageName => loadPackageInfo(outdatePackageInfo, packageName, false)),
  ).then(() => {
    if (outdatePackageInfo.length) {
      if (onlyWarn) {
        logger.warn('following packages are outdated: ', outdatePackageInfo);
      } else {
        logger.error('following packages are outdated: ', outdatePackageInfo);
        process.exit(1);
      }
    } else {
      logger.info('all dependencies check success!');
      return config;
    }
  });
}

function getTime() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const day = new Date().getDate();
  let hour = new Date().getHours();
  let minute = new Date().getMinutes();
  let second = new Date().getSeconds();
  let mileSecond = new Date().getMilliseconds();
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
  }
  if (mileSecond < 100) {
    mileSecond = '0' + mileSecond;
  }
  const time = `${year}-${month}-${day} ${hour}:${minute}:${second}.${mileSecond}`;
  return time;
}

module.exports = checkDependenceVersion;
