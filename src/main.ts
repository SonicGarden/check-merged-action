import * as core from '@actions/core'
import * as github from '@actions/github'
import execa from 'execa'

const comment = async (log: string, originBranch: string): Promise<void> => {
  const pullRequestId = github.context.issue.number
  if (!pullRequestId) {
    throw new Error('Cannot find the PR id.')
  }

  const code = '```'
  const issues = new github.GitHub(core.getInput('token', {required: true}))
    .issues

  await issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    // eslint-disable-next-line @typescript-eslint/camelcase
    issue_number: pullRequestId,
    body: `# :anger: Not merged!

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

async function run(): Promise<void> {
  try {
    const originBranch: string = core.getInput('originBranch', {
      required: true
    })
    const {stdout} = await execa.command(
      `git log HEAD ^origin/${originBranch} --no-merges`
    )
    core.debug(stdout)

    if (stdout.length > 0) {
      await comment(stdout, originBranch)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
