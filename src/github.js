const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')

function getOptions (log, changeFile) {
  const fullPath = path.resolve(changeFile)
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(fullPath)) {
      reject(new Error(`Invalid change file path specified '${fullPath}'`))
    } else {
      const ext = path.extname(changeFile)
      log(`Reading PR option file '${fullPath}'.`)
      try {
        const content = fs.readFileSync(fullPath, 'utf8')
        let options
        if (ext === '.json') {
          options = JSON.parse(content)
        } else if (/[.]ya?ml/.test(ext)) {
          options = yaml.load(content)
        } else {
          reject(new Error(`Unknown change file extension specified - '${ext}' in '${fullPath}'`))
        }
        resolve(options)
      } catch (ex) {
        reject(new Error(`Error deserializing change file '${fullPath}': ${ex.message}`))
      }
    }
  })
}

function loadModule (log, buildInfo, options) {
  return new Promise((resolve, reject) => {
    var modulePath
    try {
      modulePath = require.resolve(options.module)
    } catch (e) {
      reject(e)
    }
    log(`Loading PR transform module from '${modulePath}'`)
    try {
      options.transform = require(options.module)(buildInfo, options.args)
      resolve(options)
    } catch (ex) {
      reject(new Error(
        `Failed to load PR module '${options.module}' due to error: ${ex.message}`
      ))
    }
  })
}

function onGetOptionsFailed (log, error) {
  log(`Failed to get options for update with error: ${error.message}`)
  throw error
}

function onLoadModuleFailed (log, error) {
  log(`Failed to load module due to error: ${error.message}`)
  throw error
}

module.exports = function (log) {
  return {
    getOptions: getOptions.bind(null, log),
    loadModule: loadModule.bind(null, log),
    onGetOptionsFailed: onGetOptionsFailed.bind(null, log),
    onLoadModuleFailed: onLoadModuleFailed.bind(null, log)
  }
}
