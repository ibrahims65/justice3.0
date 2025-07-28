const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

function generateCaseNumber(region, city) {
  const regionAbbr = region.substring(0, 2).toUpperCase();
  const cityAbbr = city.substring(0, 2).toUpperCase();
  const randomNumber = nanoid();
  return `${regionAbbr}-${cityAbbr}-${randomNumber}`;
}

module.exports = {
  generateCaseNumber,
};
