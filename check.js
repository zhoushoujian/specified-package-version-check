/* eslint-disable import/no-dynamic-require */
const axios = require('axios')
const { exec } = require('child_process')

const logger = {}
const colors = {
  Reset: "\x1b[0m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m"
};
const logFunc = function (...args) {
  console.log(...args)
}
"debug:debug:FgBlue,info:info:FgGreen,warn:warn:FgYellow,error:error:FgRed,log:log:FgGreen".split(",").forEach(function (logColor) {
  const [log, info, color] = logColor.split(':');
  logger[log] = function (...args) {
    // eslint-disable-next-line no-useless-call
    logFunc.apply(null, [`${colors[color]}[${getTime()}] [${info.toUpperCase()}] [${process.pid}]${colors.Reset} `, ...args, colors.Reset])
  }
});

function getNpmCurrentVersion(packageJsonName) {
  logger.info('package', packageJsonName)
  return axios
    .get(`http://npm.kylin.shuyun.com/${packageJsonName}`)
    .then(function (res) {
      return res.data['dist-tags'].latest;
    })
    .catch(function (err) {
      logger.error('getNpmCurrentVersion err', err.stack || err.toString())
      throw err;
    });
}

// const defaultCheckDependence = [
//   '@shuyun-ep-team/eslint-config',
//   '@shuyun-ep-team/icons',
//   '@shuyun-ep-team/kylin-ui-plus',
//   '@shuyun-ep-team/monitor-track',
// ]

function checkDependenceVersion(config) {
  let checkDependenceVersionArr = [], onlyWarn = false;
  const outdatePackageInfo = []
  if (Object.prototype.toString.call(config) === '[object Object]') {
    const { ignoreCheck, onlyWarn: onlyWarnInConfig, checkAllLocalDependencies } = config
    if (!Array.isArray(config.dependenceArr)) {
      config.dependenceArr = []
    }
    checkDependenceVersionArr = [...new Set(config.dependenceArr)];
    if (ignoreCheck) {
      logger.info('npm package version check has been ignored');
      return Promise.resolve(config)
    }
    if (onlyWarnInConfig) {
      onlyWarn = onlyWarnInConfig
    }
    if (checkAllLocalDependencies) {
      logger.info("checking all local dependencies...")
      const result = [];
      return new Promise(res => {
        const child = exec('npm outdate')
        child.stdout.on('data', function (data) {
          if (onlyWarn) {
            logger.warn("outdate packages: ", data);
          } else {
            logger.error("outdate packages: ", data);
          }
          result.push(data);
        });
        child.stderr.on("data", function (data) {
          logger.warn("outdate: ", data);
        });
        child.on('exit', function (code) {
          logger.info('check all local dependencies finished! ', code)
          if (result.length && !onlyWarn) {
            process.exit(1)
          }
          res()
        });
      })
    }
  }
  if (!checkDependenceVersionArr.length) {
    logger.warn("no dependence will be checked!")
  }
  logger.info('checking dependence...')
  return Promise.all(checkDependenceVersionArr.map(item => {
    return new Promise((res) => {
      let packageInfo = null
      try {
        // eslint-disable-next-line global-require
        packageInfo = require(`${item}/package.json`)
      } catch (err) {
        // logger.error(`${item} load fail, please check`, err)
        outdatePackageInfo.push({
          name: item,
          err
        })
      }
      if (packageInfo) {
        const localVersion = packageInfo.version;
        return getNpmCurrentVersion(item)
          .then(remoteVersion => {
            if (remoteVersion > localVersion) {
              outdatePackageInfo.push({
                name: item,
                localVersion,
                remoteVersion,
              })
            }
            logger.info(`${item} => localVersion:${localVersion} => remoteVersion:${remoteVersion} => latest`)
            res()
          })
      } else {
        res()
      }
    })
  })).then(() => {
    if (outdatePackageInfo.length) {
      if (onlyWarn) {
        logger.warn("following packages are outdated: ", outdatePackageInfo)
      } else {
        logger.error("following packages are outdated: ", outdatePackageInfo)
        process.exit(1)
      }
    } else {
      logger.info('all dependencies check success!')
      return config;
    }
  })
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
    hour = "0" + hour
  }
  if (minute < 10) {
    minute = "0" + minute
  }
  if (second < 10) {
    second = "0" + second
  }
  if (mileSecond < 10) {
    mileSecond = "00" + mileSecond
  }
  if (mileSecond < 100) {
    mileSecond = "0" + mileSecond
  }
  const time = `${year}-${month}-${day} ${hour}:${minute}:${second}.${mileSecond}`;
  return time;
}

module.exports = checkDependenceVersion;
