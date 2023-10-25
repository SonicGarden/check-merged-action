import * as core from '@actions/core'
import * as github from '@actions/github'
import {exec} from 'child_process'
import {promisify} from 'util'
import replaceComment, {deleteComment} from '@aki77/actions-replace-comment'

const execAsync = promisify(exec)

const replacePrComment = async (
  log: string,
  originBranch: string
): Promise<void> => {
  const pullRequestId = github.context.issue.number
  if (!pullRequestId) {
    throw new Error('Cannot find the PR id.')
  }

  const title = core.getInput('title', {required: true})
  const code = '```'

  await replaceComment({
    token: core.getInput('token', {required: true}),
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: pullRequestId,
    body: `${title}

[:octocat: New pull request](https://github.com/${process.env.GITHUB_REPOSITORY}/compare/${originBranch}...${process.env.GITHUB_HEAD_REF})

<details>
<summary>Log</summary>

${code}
${log}
${code}

</details>
`
  })
}

const deletePrComment = async (): Promise<void> => {
  const pullRequestId = github.context.issue.number
  if (!pullRequestId) {
    throw new Error('Cannot find the PR id.')
  }

  await deleteComment({
    token: core.getInput('token', {required: true}),
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: pullRequestId,
    body: core.getInput('title', {required: true}),
    startsWith: true
  })
}

async function run(): Promise<void> {
  try {
    const originBranch: string = core.getInput('originBranch', {
      required: true
    })

    await execAsync(`git fetch origin ${originBranch}`)

    const {stdout} = await execAsync(
      `git log HEAD ^origin/${originBranch} --no-merges`
    )
    core.debug(stdout)

    if (stdout.length > 0) {
      await replacePrComment(stdout, originBranch)
    } else {
      await deletePrComment()
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
