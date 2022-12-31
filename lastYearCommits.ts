const query = (username: string) =>
  `{
    user(login: "${username}") {
        contributionsCollection(from: "2022-01-01T00:00:00.000Z", to: "2023-01-01T00:00:00.000Z") {
        totalCommitContributions
        restrictedContributionsCount
      }
    }
  }
`.trim();

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
