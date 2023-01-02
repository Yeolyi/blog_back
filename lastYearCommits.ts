const query = (username: string) => {
  const now = new Date();

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return `{
    user(login: "${username}") {
        contributionsCollection(from: "${oneYearAgo.toISOString()}", to: "${now.toISOString()}") {
        totalCommitContributions
        restrictedContributionsCount
      }
    }
  }
`.trim();
};

const getLastYearCommitCount = async (username: string, token: string) => {
  const res = await fetch(`https://api.github.com/graphql`, {
    method: 'post',
    body: JSON.stringify({ query: query(username) }),
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
  });
  const json = await res.json();
  const contributionsCollection = json.data.user.contributionsCollection;
  console.log(contributionsCollection);

  return (
    contributionsCollection.totalCommitContributions +
    contributionsCollection.restrictedContributionsCount
  );
};

export default getLastYearCommitCount;
