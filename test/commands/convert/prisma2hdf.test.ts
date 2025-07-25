import {runCommand} from '@oclif/test'
import fs from 'fs'
import path from 'path'
import tmp from 'tmp'
import {describe, expect, it} from 'vitest'
import {omitHDFChangingFields} from '../utils'

describe('Test prisma', () => {
  const tmpobj = tmp.dirSync({unsafeCleanup: true})

  it('hdf-converter output test', async () => {
    await runCommand<{name: string}>([
      'convert prisma2hdf',
      '-i', path.resolve('./test/sample_data/prisma/sample_input_report/prismacloud_sample.csv'),
      '-o', `${tmpobj.name}/prismatest`,
    ])
    const test1 = JSON.parse(fs.readFileSync(`${tmpobj.name}/prismatest/localhost.json`, 'utf8'))
    const test2 = JSON.parse(fs.readFileSync(`${tmpobj.name}/prismatest/my-fake-host-1.somewhere.cloud.json`, 'utf8'))
    const test3 = JSON.parse(fs.readFileSync(`${tmpobj.name}/prismatest/my-fake-host-2.somewhere.cloud.json`, 'utf8'))

    const sample1 = JSON.parse(fs.readFileSync(path.resolve('test/sample_data/prisma/localhost.json'), 'utf8'))
    const sample2 = JSON.parse(fs.readFileSync(path.resolve('test/sample_data/prisma/my-fake-host-1.somewhere.cloud.json'), 'utf8'))
    const sample3 = JSON.parse(fs.readFileSync(path.resolve('test/sample_data/prisma/my-fake-host-2.somewhere.cloud.json'), 'utf8'))

    expect(omitHDFChangingFields(test1)).to.eql(omitHDFChangingFields(sample1))
    expect(omitHDFChangingFields(test2)).to.eql(omitHDFChangingFields(sample2))
    expect(omitHDFChangingFields(test3)).to.eql(omitHDFChangingFields(sample3))
  })
})
