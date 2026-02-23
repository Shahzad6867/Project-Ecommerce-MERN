const crypto = require("crypto")
function generateReferralCode(userId) {
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  const userPart = userId.toString().slice(-4).toUpperCase();

  return `REF-${userPart}-${randomPart}`;
}
module.exports = generateReferralCode;
