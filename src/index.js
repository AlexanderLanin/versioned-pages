const core = require('@actions/core')
const { execSync } = require('child_process')
const fs = require('fs')
const io = require('@actions/io')
const exec = require('@actions/exec').exec

function determineActionAndTargetFolder(
  eventName,
  eventAction,
  refName,
  pullRequestNumber
) {
  let action = 'none'
  let targetFolder = ''

  if (eventName === 'pull_request') {
    targetFolder = `pr-${pullRequestNumber}`
    if (eventAction === 'closed') {
      action = 'delete'
    } else if (['opened', 'reopened', 'synchronize'].includes(eventAction)) {
      action = 'deploy'
    }
  } else if (eventName === 'push') {
    action = 'deploy'
    if (refName !== 'main') {
      targetFolder = refName
    }
  } else if (eventName === 'delete') {
    action = 'delete'
    targetFolder = refName
  }

  return { action, targetFolder }
}

async function downloadVersionsFileIntoTmpDirectory(versionsFilePath) {
  try {
    const tmpDir = 'versioned-pages-versions-file-tmp-dir'
    await exec(`git fetch origin gh-pages --depth 1`)
    await exec(`git checkout origin/gh-pages -- `, [versionsFilePath], {
      cwd: tmpDir
    })
    return tmpDir
  } catch (error) {
    core.setFailed(`Downloading versions file failed: ${error.message}`)
    // TODO: error handling
  }
}

async function addTargetFolderToVersionsFile(
  versionsFileDirectory,
  versionsFilePath,
  targetFolder
) {
  try {
    const fullPath = path.join(versionsFileDirectory, versionsFilePath)
    const currentVersions = await fs.readFile(fullPath, 'utf-8')
    if (!currentVersions.includes(targetFolder)) {
      await fs.appendFile(fullPath, `\n${targetFolder}`)
      core.info(`Added ${targetFolder} to ${versionsFile}`)
    }
  } catch (error) {
    core.setFailed(`Updating versions file failed: ${error.message}`)
  }
}

async function removeTargetFolderFromVersionsFile(
  versionsFileDirectory,
  versionsFilePath,
  targetFolder
) {
  try {
    const fullPath = path.join(versionsFileDirectory, versionsFilePath)
    const currentVersions = await fs.readFile(fullPath, 'utf-8')
    const updatedVersions = currentVersions
      .split('\n')
      .filter(version => version !== targetFolder)
      .join('\n')

    if (currentVersions !== updatedVersions) {
      await fs.writeFile(fullPath, updatedVersions)
      core.info(`Removed ${targetFolder} from ${versionsFile}`)
    }
  } catch (error) {
    core.setFailed(`Updating versions file failed: ${error.message}`)
  }
}

async function cpR(source, target) {
  await io.cp(source, target, { recursive: true })
}

async function deploy_folder(sourceFolder, targetFolder) {
  await exec('npx', [
    'github-pages-deploy-action',
    '--folder',
    sourceFolder,
    '--target-folder',
    targetFolder
  ])
}

async function deployFoldeRemoval(targetFolder) {
  await exec('npx', ['rm', '--', targetFolder])
}

async function deployDocumentation(
  sourceFolder,
  targetFolder,
  versionsFilePath
) {
  try {
    // Use JamesIves/github-pages-deploy-action to deploy the documentation
    // from the source folder to the target folder.
    // This will take care of e.g. rebasing onto the gh-pages branch in case of
    // parallel changes.
    await deploy_folder(sourceFolder, targetFolder)
    core.info(`Deployed ${targetFolder} to gh-pages branch`)

    // Add the target folder to the versions file.
    // Note: github-pages-deploy-action only supports deploying folders,
    // not individual files.
    // Creating a temporary folder just for this file, as suggested in
    // https://github.com/JamesIves/github-pages-deploy-action/discussions/997#discussioncomment-1944672
    const tmdDir = await downloadVersionsFileIntoTmpDirectory(versionsFilePath)
    await addTargetFolderToVersionsFile(tmdDir, versionsFilePath, targetFolder)
    await deploy_folder(tmdDir, '.')
    await io.rmRF(tmdDir)
    core.info(`Added ${targetFolder} to ${versionsFilePath}`)
  } catch (error) {
    core.setFailed(
      `Deployment or updating versions file failed: ${error.message}`
    )
  }
}

async function purgeOldVersion(versionsFile, targetFolder) {
  try {
    // Remove the target folder from the versions file.
    const tmdDir = await downloadVersionsFileIntoTmpDirectory(versionsFilePath)
    await addTargetFolderToVersionsFile(tmdDir, versionsFilePath, targetFolder)
    await deploy_folder(tmdDir, '.')
    await io.rmRF(tmdDir)
    core.info(`Removed ${targetFolder} from ${versionsFilePath}`)

    // Remove the target folder from the gh-pages branch.
  } catch (error) {
    core.setFailed(`Cleanup failed: ${error.message}`)
  }
}

async function run() {
  try {
    const eventName = core.getInput('event_name')
    const eventAction = core.getInput('event_action')
    const refName = core.getInput('ref_name')
    const pullRequestNumber = core.getInput('pull_request_number')
    const sourceFolder = core.getInput('source_folder')
    const versionsFile = core.getInput('versions_file')

    const { action, targetFolder } = determineActionAndTargetFolder(
      eventName,
      eventAction,
      refName,
      pullRequestNumber
    )

    if (action === 'deploy') {
      deployDocumentation(sourceFolder, targetFolder)
      addTargetFolderToVersionsFile(versionsFile, targetFolder)
    } else if (action === 'delete') {
      purgeOldVersion(versionsFile, targetFolder)
    }

    core.setOutput('performed_action', action)
    core.setOutput('target_folder', targetFolder)
  } catch (error) {
    core.setFailed(error.message)
  }
}

if (require.main === module) {
  run()
}

module.exports = {
  determineActionAndTargetFolder,
  deployDocumentation,
  updateVersionsFile: addTargetFolderToVersionsFile,
  cleanup: purgeOldVersion
}
