require('./setup.js')
const path = require('path')
const log = sinon.spy(function () {})
const githubChangeFile = sinon.stub()
const github = require('../src/github')(log, githubChangeFile)

describe('GitHub', function () {
  it('should log options file load failures in correct format', function () {
    (function () {
      github.onGetOptionsFailed(new Error('ohnoes'))
    }).should.throw(Error, 'ohnoes')
    log.should.have.been.calledWith(
      'Failed to get options for update with error: ohnoes'
    )
  })

  it('should log module failures in correct format', function () {
    (function () {
      github.onLoadModuleFailed(new Error('oops'))
    }).should.throw(Error, 'oops')
    log.should.have.been.calledWith(
      'Failed to load module due to error: oops'
    )
  })

  describe('get options', function () {
    it('should reject with error when given a bad path', function () {
      return github.getOptions('./test')
        .should.be.rejectedWith(
          Error,
          `Invalid change file path specified '${path.resolve('./test')}'`
        )
    })

    it('should load valid json', function () {
      return github.getOptions('./spec/plugins/example.json')
        .should.eventually.eql({
          source: {
            owner: 'npm-wharf',
            repo: 'shipwright',
            file: './package.json'
          },
          module: '../spec/plugins/example'
        })
    })

    it('should load valid yaml', function () {
      return github.getOptions('./spec/plugins/example.yaml')
        .should.eventually.eql({
          source: {
            owner: 'npm-wharf',
            repo: 'shipwright',
            file: './package.json',
            branch: 'not-master'
          },
          module: './spec/plugins/example'
        })
    })

    it('should load valid yml', function () {
      return github.getOptions('./spec/plugins/example.yml')
        .should.eventually.eql({
          source: {
            owner: 'npm-wharf',
            repo: 'shipwright',
            file: './package.json'
          },
          module: './spec/plugins/example',
          branch: 'update-shipwright-version'
        })
    })

    it('should fail to load invalid json', function () {
      return github.getOptions('./spec/plugins/nope.json')
        .should.be.rejectedWith(Error,
          /Error deserializing change.*nope\.json/
        )
    })

    it('should fail to load invalid extention', function () {
      return github.getOptions('./spec/plugins/nope.txt')
        .should.be.rejectedWith(Error,
          `Unknown change file extension specified - '.txt' in '${path.resolve('./spec/plugins/nope.txt')}'`
        )
    })
  })

  describe('module load', function () {
    it('should reject with error when given a bad path', function () {
      return github.loadModule({}, { module: './test' })
        .should.be.rejectedWith(Error, "Cannot find module './test'")
    })

    it('should reject with error when module is invalid', function () {
      return github.loadModule({}, { module: '../spec/plugins/invalid' })
      .should.be.rejectedWith(Error, /Failed to load PR module \'..\/spec\/plugins\/invalid\' due to error: Unexpected token/)
    })

    describe('when valid module is provided', function () {
      var options
      before(function () {
        return github.loadModule({}, { module: '../spec/plugins/example' })
          .then(function (x) {
            options = x
          })
      })

      it('should add transform to options', function () {
        options.should.have.property('module')
        options.should.have.property('transform')
      })

      it('should log loading module', function () {
        log.should.be.calledWith(
          `Loading PR transform module from '${require.resolve('../spec/plugins/example')}'`
        )
      })
    })
  })
})
