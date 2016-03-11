#!/usr/bin/env node

'use strict';

const program   = require("commander")
const pkg       = require('./package.json')
const impressum = require('./lib/impressum')

const parsedArgs = (method) => {
  var args = program.rawArgs.slice(2)
  args = args
    .map((item) => item === method ? undefined : item.replace('--', ''))
    .filter((item) => item !== undefined)

  return args
}

program
  .version(pkg.version)
  .option('init', `Bootstrap the directory structure for ${pkg.name}`)
  .option('build', 'Build site which is ready for deployment.')
  .option('--verbose', `Process verbosely printing all information`)
  .parse(process.argv)

if(program.init) {
  
  let status = impressum.bootstrap()
  
  if(status !== true) {
    console.error(status.message)
    process.exit(1)
  }
    
}

if(program.build) {

  let args = parsedArgs('build')

  let status = impressum.build(args)

  if(status !== true) {
    console.error(status.message)
    process.exit(1)
  }

}

process.exit(0)