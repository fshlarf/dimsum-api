module.exports = function convertSnakeToCamelCase(obj) {
  const camelCaseObj = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelCaseKey = key.replace(/_([a-z])/g, function (match, letter) {
        return letter.toUpperCase();
      });
      camelCaseObj[camelCaseKey] = obj[key];
    }
  }
  return camelCaseObj;
};
