import { exec } from 'child_process';
import axios from 'axios';
import * as fs from 'fs';
import * as semver from 'semver';
import * as depcheck from 'depcheck';
import * as ora from 'ora';
import {
  isNodejs,
  getTime,
  hostname,
  getProjectFolder,
  dealWithFilePath,
  comparePackageVersion,
  uploadPackageInfo,
  slash,
  getNpmCurrentVersion,
} from './utils';
//@ts-ignore
import { name, version } from '../package.json';
import { IConfig } from './type';

let silent: boolean = false;
const logger = {
  debug: (...args: any[]) => {
    // eslint-disable-next-line no-console
    !silent && console.debug(...args);
  },
  log: (...args: any[]) => {
    // eslint-disable-next-line no-console
    !silent && console.log(...args);
  },
  info: (...args: any[]) => {
    // eslint-disable-next-line no-console
    !silent && console.info(...args);
  },
  warn: (...args: any[]) => {
    // eslint-disable-next-line no-console
    !silent && console.warn(...args);
  },
  error: (...args: any[]) => {
    // eslint-disable-next-line no-console
    !silent && console.error(...args);
  },
};

function fetchGlobalPackageCliNames(remoteUrl: string) {
  if (remoteUrl) {
    return axios
      .get(remoteUrl)
      .then((res: any) => {
        return res.data;
      })
      .catch((err: any) => {
        logger.warn(name, ': fetchGlobalPackageNames err', err.stack || err.toString());
        return {};
      });
  } else {
    return Promise.resolve({});
  }
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
      // eslint-disable-next-line import/no-dynamic-require, global-require
      packageInfo = require(`${packageName}/package.json`);
    } catch (err: any) {
      outdatePackageInfo.push({
        name: packageName,
        err: err.stack || err.toString(),
      });
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
            note: globalVersion ? `Global ${packageName} version has expired, please upgrade` : '',
          });
        } else {
          logger.info(
            `${packageName} => ${
              globalVersion ? 'globalVersion' : 'localVersion'
            }: ${localVersion} => remoteVersion: ${remoteVersion} => latest`,
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

async function checkDependenceVersion(config: IConfig): Promise<IOutdatePackageInfo[]> {
  try {
    let checkDependenceVersionArr: string[] = [name],
      onlyWarn = false,
      enableGlobalCliCheck = false;
    const outdatePackageInfo: IOutdatePackageInfo[] = [];
    const projectFolder = getProjectFolder();
    let npmCli = 'npm';
    try {
      if (fs.existsSync(`${projectFolder}node_modules${slash}.pnpm`)) {
        npmCli = 'pnpm';
      }
    } catch (_err) {
      //
    }
    if (Object.prototype.toString.call(config) === '[object Object]' || config === undefined) {
      if (config === undefined) {
        config = { dependenceArr: [] };
      }
      silent = config.silent as boolean;
      // eslint-disable-next-line no-console
      !silent && console.log('\x1b[33mProject root folder: ', projectFolder + '\x1b[0m');
      const { ignoreCheck, onlyWarn: onlyWarnInConfig, checkAllLocalDependencies } = config;
      if (!Array.isArray(config.dependenceArr)) {
        config.dependenceArr = [];
      }
      checkDependenceVersionArr = [...new Set([...config.dependenceArr, name])];
      if (ignoreCheck) {
        logger.warn('npm package version check has been ignored');
        comparePackageVersion(name, version).then(({ result }: { result: boolean | Error }) => {
          if (result === true) {
            exec(`${npmCli} install ${name}@latest -D`, { cwd: projectFolder });
          }
        });
        return Promise.resolve(outdatePackageInfo);
      }
      if (onlyWarnInConfig) {
        onlyWarn = onlyWarnInConfig;
      }
      if (config.enableGlobalCliCheck === true) {
        enableGlobalCliCheck = true;
      }
      if (checkAllLocalDependencies) {
        logger.info('specified-package-version-check: checking all local dependencies...');
        const result: string[] = [];
        return new Promise((res) => {
          const child = exec('npm outdate');
          child.stdout?.on('data', function (data: string) {
            if (onlyWarn) {
              logger.warn(name, ': outdate packages: ', data);
            } else {
              logger.error(name, ': outdate packages: ', data);
            }
            result.push(data);
          });
          child.stderr?.on('data', function (data: string) {
            logger.warn(name, ': outdate: ', data);
          });
          child.on('exit', function (code: number) {
            logger.info('specified-package-version-check: check all local dependencies finished! ', code);
            if (result.length && !onlyWarn) {
              process.exit(1);
            }
            res(outdatePackageInfo);
          });
        });
      }
    } else {
      throw new Error('specified-package-version-check: config must be an object or undefined, config: ' + config);
    }
    if (config.useDepCheck) {
      logger.debug('specified-package-version-check: checking useless dependencies...');
      await depcheck(projectFolder, config.depcheckOptions || {})
        .then((unused: any) => {
          if (unused.dependencies && unused.dependencies.length) {
            outdatePackageInfo.push({
              name: 'unused.dependencies',
              note: unused.dependencies,
            });
          }
          if (unused.missing && Object.keys(unused.missing).length) {
            outdatePackageInfo.push({
              name: 'unused.missing',
              note: unused.missing,
            });
          }
          // logger.log(unused.dependencies); // an array containing the unused dependencies
          // logger.log(unused.devDependencies); // an array containing the unused devDependencies
          // logger.log(unused.missing); // a lookup containing the dependencies missing in `package.json` and where they are used
          // logger.log(unused.using); // a lookup indicating each dependency is used by which files
          // logger.log(unused.invalidFiles); // files that cannot access or parse
          // logger.log(unused.invalidDirs); // directories that cannot access
        })
        .catch((err: Error) => {
          logger.warn('specified-package-version-check: depcheck happened an error', err.stack || err.toString());
        });
    }
    if (enableGlobalCliCheck) {
      logger.debug('specified-package-version-check: checking global dependencies...');
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await fetchGlobalPackageCliNames(config.remoteUrl || '');
      if (Array.isArray(result.info)) {
        await Promise.all(
          result.info.map((item: { command: string; name: string }) => {
            return new Promise((res) => {
              const child = exec(item.command);
              child.stdout?.on('data', async function (data: string) {
                data = data.replace('\n', '').replace('\r', '');
                await loadPackageInfo(outdatePackageInfo, item.name, data);
                res(0);
              });
              child.stderr?.on('data', function () {
                // command execute fail
                // logger.warn('npm global cli stderr: ', data);
              });
              child.on('exit', function () {
                res(0);
              });
            });
          }),
        );
      } else {
        logger.warn(name, ': info is not an array, read readme.md carefully');
      }
    }
    logger.debug('specified-package-version-check: checking local dependencies...');
    await Promise.all(
      checkDependenceVersionArr
        .filter((item) => {
          if (config.ignoreSelf) {
            return item !== name;
          } else {
            return true;
          }
        })
        .map((packageName) => loadPackageInfo(outdatePackageInfo, packageName, '')),
    ).then(async () => {
      if (outdatePackageInfo.length) {
        let invalidPackages = outdatePackageInfo;
        if (config.autoFixOutdateDep !== false) {
          config.autoFixOutdateDep = true;
        }
        if (config.autoFixOutdateDep) {
          const localCanAutoFixed: string[] = [];
          const globalCanAutoFixed: string[] = [];
          invalidPackages = invalidPackages.filter((item) => {
            const { name, localVersion, remoteVersion, note } = item;
            if (name && localVersion && remoteVersion && semver.gt(remoteVersion, localVersion)) {
              if (note === '') {
                logger.info(`local dep ${name} has new version, local: ${localVersion}, remote: ${remoteVersion}`);
                localCanAutoFixed.push(name);
                return false;
              } else if (note && note.includes('Global')) {
                logger.info(`global cli ${name} has new version, local: ${localVersion}, remote: ${remoteVersion}`);
                globalCanAutoFixed.push(name);
                return false;
              } else {
                return true;
              }
            } else {
              return true;
            }
          });
          if (globalCanAutoFixed.length) {
            await new Promise((res) => {
              const command = `npm install ${globalCanAutoFixed.map((item) => `${item}@latest`).join(` `)} -g`;
              logger.warn('following global package cli are outdate, try to fixing', globalCanAutoFixed);
              logger.info('specified-package-version-check: command: ', command);
              logger.info('specified-package-version-check: start install packages, please wait...');
              const canAutoFixedString = globalCanAutoFixed.toString();
              const spinner = ora(`updating global deps:  (${canAutoFixedString})...`).start();
              const child = exec(command);
              child.stdout?.on('data', async function (data: string) {
                spinner.text = `${canAutoFixedString}: ${data}`;
              });
              child.stderr?.on('data', function (data: string) {
                if (data && data.trim().toLowerCase() !== 'npm' && data.trim().toLowerCase() !== 'npm warn') {
                  // eslint-disable-next-line no-console
                  console.warn('\r\n\x1b[33mnpm\x1b[0m', data);
                }
              });
              child.on('exit', function () {
                spinner.stop();
                res(0);
              });
            }).catch((err) => logger.error(err));
          }
          if (localCanAutoFixed.length) {
            await new Promise((res) => {
              const command = `${npmCli} install ${localCanAutoFixed.map((item) => `${item}@latest`).join(` `)}`;
              logger.warn('following packages are outdate, try to fixing', localCanAutoFixed);
              logger.info('specified-package-version-check: command: ', command);
              logger.info('specified-package-version-check: start install packages, please wait...');
              const canAutoFixedString = localCanAutoFixed.toString();
              const spinner = ora(`updating local deps: (${canAutoFixedString})...`).start();
              const child = exec(command, { cwd: projectFolder });
              child.stdout?.on('data', async function (data: string) {
                spinner.text = `${canAutoFixedString}: ${data}`;
                if (data.includes('ERR_PNPM_REGISTRIES_MISMATCH')) {
                  invalidPackages.push({
                    name: localCanAutoFixed.toString(),
                    localVersion: 'unknown',
                    remoteVersion: 'latest',
                    note: '',
                    err: data,
                  });
                }
              });
              child.stderr?.on('data', function (data: string) {
                if (data && data.trim().toLowerCase() !== 'npm' && data.trim().toLowerCase() !== 'npm warn') {
                  // eslint-disable-next-line no-console
                  console.warn('\r\n\x1b[33mnpm\x1b[0m', data);
                }
              });
              child.on('exit', function (code) {
                logger.info('exit code', code);
                if (code !== 0) {
                  logger.error(`${command}运行失败, code: ${code}`);
                }
                spinner.stop();
                res(0);
              });
            }).catch((err) => logger.error(err));
          }
          if (!invalidPackages.length) {
            logger.info(name, ': all dependencies fixed success!');
            return;
          }
        }
        if (onlyWarn) {
          logger.warn(name, ': following packages are invalid: ', invalidPackages);
        } else {
          //进程退出一定要打印日志
          // eslint-disable-next-line no-console
          console.error(name, ': following packages are invalid: ', invalidPackages);
          process.exit(1);
        }
      } else {
        logger.info(name, ': all dependencies check success!');
      }
    });
    return outdatePackageInfo;
  } catch (err) {
    logger.error('specified-package-version-check: checkDependenceVersion happened an error', err);
    return [];
  }
}

checkDependenceVersion.hostname = hostname;
checkDependenceVersion.getTime = getTime;
checkDependenceVersion.getProjectFolder = getProjectFolder;
checkDependenceVersion.comparePackageVersion = comparePackageVersion;
checkDependenceVersion.dealWithFilePath = dealWithFilePath;
checkDependenceVersion.uploadPackageInfo = uploadPackageInfo;
checkDependenceVersion.isNodejs = isNodejs;

module.exports = checkDependenceVersion;
