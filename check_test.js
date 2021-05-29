const checkDependenceVersion = require('./check')

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