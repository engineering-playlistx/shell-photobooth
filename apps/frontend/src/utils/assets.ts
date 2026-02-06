function getAssetPath(path: string): string {
  if (path.startsWith("/")) {
    path = path.slice(1);
  }

  if (window.location.protocol === "file:") {
    return `./${path}`;
  }

  return `/${path}`;
}

export { getAssetPath };
