const asinRegex = /dp%2F([A-Za-z0-9]{10})%2F|\/dp\/([A-Za-z0-9]{10})/g;

export const parseAsinFromUrl = (url) => {
  try {
    if (url) {
      const match = [...url.matchAll(asinRegex)];
      if (match && match[0]) {
        return match[0][1] || match[0][2];
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};
