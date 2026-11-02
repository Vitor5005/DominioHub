export const domainCacheKeys = {
  list(
    organizationId: string,
  ) {
    return [
      'dominiohub',
      'v1',
      'organization',
      organizationId,
      'domains',
      'list',
    ].join(':');
  },
};