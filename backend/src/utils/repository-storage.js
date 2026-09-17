export const getRepositoryPrefix = (repositoryId) => {
  return `repositories/${repositoryId}/`;
};

export const getObjectKey = (
  repositoryId,
  objectHash
) => {
  return (
    `repositories/${repositoryId}/objects/${objectHash}`
  );
};

export const getHeadKey = (repositoryId) => {
  return `repositories/${repositoryId}/HEAD`;
};

export const getRefKey = (
  repositoryId,
  branch
) => {
  return (
    `repositories/${repositoryId}/refs/heads/${branch}`
  );
};