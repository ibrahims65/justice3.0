const getBreadcrumbs = (path) => {
  const segments = path.split('/').filter(s => s);
  const breadcrumbs = segments.map((segment, index) => {
    const url = '/' + segments.slice(0, index + 1).join('/');
    const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    return { url, name };
  });
  return breadcrumbs;
};

module.exports = {
  getBreadcrumbs,
};
