//@ts-ignore
const checkDependenceVersion = require('./check');

async function func() {
  await checkDependenceVersion({
    dependenceArr: ['eslint-config-ts-base'],
    useDepCheck: true,
    ignoreCheck: false,
    onlyWarn: false,
    checkAllLocalDependencies: false,
    ignoreSelf: true,
    remoteUrl: '',
    uploadPackageInfoUrl: '',
    autoFixOutdateDep: true,
    silent: false,
    enableGlobalCliCheck: false,
  });

  // eslint-disable-next-line no-console
  console.log('finished!');
}

func();
