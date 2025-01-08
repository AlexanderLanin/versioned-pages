const assert = require('assert')
const determineActionAndTargetFolder = require('../index.js')

describe('determineActionAndTargetFolder', () => {
  it('pull_request opened', () => {
    result = determineActionAndTargetFolder('pull_request', 'opened', null, 7)
    assert(result.action === 'deploy')
    assert(result.targetFolder === 'pr-7')
  })

  it('pull_request closed', () => {
    result = determineActionAndTargetFolder('pull_request', 'closed', null, 42)
    assert(result.action === 'delete')
    assert(result.targetFolder === 'pr-42')
  })

  it('push to branch', () => {
    const result = determineActionAndTargetFolder('push', null, 'branch', null)
    assert(result.action === 'deploy')
    assert(result.targetFolder === 'branch')
  })

  it('push to main', () => {
    const result = determineActionAndTargetFolder('push', null, 'main', null)
    assert(result.action === 'deploy')
    assert(result.targetFolder === '')
  })

  it('delete branch', () => {
    const result = determineActionAndTargetFolder('delete', null, 'old', null)
    assert(result.action === 'delete')
    assert(result.targetFolder === 'old')
  })

  it('unknown event', () => {
    const result = determineActionAndTargetFolder('unknown', null, null, null)
    assert(result.action === 'none')
    assert(result.targetFolder === '')
  })
})
