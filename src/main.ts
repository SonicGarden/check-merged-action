import * as core from '@actions/core'
import * as github from '@actions/github'
import execa from 'execa'

const comment = async (log: string): Promise<void> => {
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
    body: `# Not merged staging!

${code}
${log}
${code}
`
  })
}

async function run(): Promise<void> {
  try {
    const stagingBranch: string = core.getInput('stagingBranch', {
      required: true
    })
    const {stdout} = await execa.command(
      `git log HEAD ^origin/${stagingBranch} --no-merges`
    )
    core.debug(stdout)

    if (stdout.length > 0) {
      await comment(stdout)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
