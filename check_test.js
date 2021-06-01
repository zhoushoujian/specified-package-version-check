const checkDependenceVersion = require('./check')

async function func() {
  await checkDependenceVersion({
    dependenceArr: ['axios', '@shuyun-ep-team/eslint-config'],
    ignoreCheck: false,
    onlyWarn: false,
    checkAllLocalDependencies: false
  })
  
  console.log('end');
}

func()