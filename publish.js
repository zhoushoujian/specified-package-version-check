/* eslint-disable no-console */
const { exec } = require('child_process');

let useTaobaoMirror = false;

function getNpmConfig() {
  console.log('获取npm配置信息');
  return executeCmd('npm config get registry', 'changeNpmConfig');
}

function changeNpmConfig() {
  console.log('正在临时关闭代理');
  return executeCmd('npm config set registry=https://registry.npmjs.org', '暂时关闭淘宝镜像');
}

function publish() {
  console.log('开始发布');
  return executeCmd('npm publish --registry https://registry.npmjs.org', 'publish');
}

function syncTaoBao() {
  console.log('正在同步淘宝镜像');
  return executeCmd('curl -X PUT https://npm.taobao.org/sync/specified-package-version-check', 'syncTaoBao');
}

function executeCmd(cmd, logInfo) {
  return new Promise((res) => {
    const child = exec(cmd);
    child.stdout.on('data', function (data) {
      console.log(`${logInfo} stdout: `, data);
      if (logInfo === 'changeNpmConfig' && !data.includes('registry.npmjs.org')) {
        useTaobaoMirror = true;
      }
    });
    child.stderr.on('data', function (data) {
      console.warn(`${logInfo} stderr: `, data);
    });
    child.on('exit', function (code) {
      console.log(`${logInfo} exit code: `, code);
      if (code === 0) {
        console.log(`${logInfo} 成功`);
      } else {
        console.error(`${logInfo} 失败`);
        process.exit(1);
      }
      res();
    });
  });
}

getNpmConfig()
  .then(() => {
    console.log('使用了淘宝镜像', useTaobaoMirror);
    if (useTaobaoMirror) {
      changeNpmConfig();
    }
  })
  .then(publish)
  .then(syncTaoBao)
  .then(() => {
    console.log('发布成功');
    process.exit(0);
  })
  .catch((err) => {
    console.error('publish catch err', err);
    process.exit(1);
  });
