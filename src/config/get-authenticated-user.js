export default async function getAuthenticatedUser({ octokit }) {
  try {
    return await octokit.users.getAuthenticated()
  } catch (err) {
    return null
  }
}
