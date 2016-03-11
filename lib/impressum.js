'use strict';

// modules
const fs     = require('fs')
const marked = require('marked')
const path   = require('path')

// helper functions
const first = arr => arr[0]
const last  = arr => first(arr.slice(-1))

// fetches the file's header and parses it
const fileHeader = (data) => {

  const exp = /^(-{4}\n[\s\S]*\n-{4}\n)/gim
  let result = exp.exec(data)

  let header = result && result.length ? result[0] : ''

  return header

}

const fileBody = (data) => {

  const exp = /-{4}\n\n([\s\S]*)\n?\s?$/gim
  let result = exp.exec(data)

  return result && result.length >= 1 ? result[1] : ''

}

// main class
class Impressum {

  folderExistsAtPath(dir) {

    if(!dir)
      return false

    try {
      return fs.lstatSync(dir).isDirectory()
    }
    catch(exc) {
      return false
    }

  }

  createFolderAtPath(dir) {

    return new Promise((resolve) => {

      fs.mkdir(dir, () => {
        resolve.call(arguments)
      })

    })

  }

  createFolderNX(dir) {

    if(!this.folderExistsAtPath(dir))
        return this.createFolderAtPath(dir, () => { console.log([].slice.call(arguments)) })
      else
        return new Error(`${dir} already exists. Aborting.`)

  }

  createFolderRecurse(dir, cb) {

    if(!dir)
      return false

    let self = this

    if(dir === './.site')
      return

    let parent = path.dirname(dir)
    
    if(!self.folderExistsAtPath(parent))
      self.createFolderRecurse(parent)

    if(!self.folderExistsAtPath(dir))
      fs.mkdirSync(dir)

  }

  //walks a given dir synchronously and returns a list of files
  walkSync(dir, fileList) {

    // sanitize input
    if(dir.charAt(dir.length-1) !== '/')
      dir = dir + '/'

    let files = fs.readdirSync(dir)

    let list = fileList || []

    files.forEach((item) => {
      if(fs.statSync(dir + item).isDirectory())
        list = this.walkSync(dir + item + '/', list)
      else
        list.push(dir + item)
    })

    return list

  }

  parseFileHeader(data) {

    var header = fileHeader(data)

    // remove the header delimiters
    while(header.indexOf('----') >= 0)
      header = header.replace('----\n', '')

    // split the header into individual components
    header = header.split('\n')
      .filter((item) => item.length)
      .map((item) => item.replace('# ', ''))

    let obj = {}

    header.forEach((item) => {
      let data = item.split(": ")
      obj[data[0]] = data[1]
    })

    return obj

  }

  parseFilePost(data) {

    let body = fileBody(data)
    return marked(body)

  }

  bootstrap() {

    let date = new Date()
    const folderDate = `./posts/${date.getFullYear()}`

    var x = ['./.site', './templates', './posts', folderDate]
      .reduce((prev, item) => {
        // break on first error
        if(prev && prev.constructor == Error)
          return prev

        let stat = this.createFolderNX(item)

        if(stat.constructor == Error) {
          return stat
        }

        return item

      }, null)

    return x == folderDate ? true : x

  }

  build(args) {

    let files = this.walkSync('./posts')
    let parsed = files.map((item) => {

      let data = fs.readFileSync(item)
      let header = this.parseFileHeader(data)
      
      let post = this.parseFilePost(data)
      
      let toPathDir = item.replace('./posts', './.site').replace('.md', '')

      this.createFolderRecurse(toPathDir)

      let toPath = toPathDir + "/index.html"

      fs.writeFileSync(toPath, new Buffer(post))
      
      return post

    })

    return true

  }

}

if (typeof module != "undefined" && module.exports)
  module.exports = new Impressum()