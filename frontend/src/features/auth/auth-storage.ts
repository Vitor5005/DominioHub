const ACCESS_TOKEN_KEY =
  'dominiohub.accessToken';

export function getAccessToken() {
  return sessionStorage.getItem(
    ACCESS_TOKEN_KEY,
  );
}

export function setAccessToken(
  accessToken: string,
) {
  sessionStorage.setItem(
    ACCESS_TOKEN_KEY,
    accessToken,
  );
}

export function clearAccessToken() {
  sessionStorage.removeItem(
    ACCESS_TOKEN_KEY,
  );
}
