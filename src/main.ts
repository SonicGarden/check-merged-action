import * as core from '@actions/core'
import * as github from '@actions/github'
import execa from 'execa'
import replaceComment, {deleteComment} from '@aki77/actions-replace-comment'

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

    await execa.command(`git fetch origin ${originBranch}`)

    const {stdout} = await execa.command(
      `git log HEAD ^origin/${originBranch} --no-merges`
    )
    core.debug(stdout)

    if (stdout.length > 0) {
      await replacePrComment(stdout, originBranch)
      core.setFailed('pr branch not merged to ${originBranch}')
    } else {
      await deletePrComment()
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
