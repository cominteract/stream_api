const RtmTokenBuilder = require('./agoranode/src/RtmTokenBuilder').RtmTokenBuilder;
const RtmRole = require('./agoranode/src/RtmTokenBuilder').Role;
const Priviledges = require('./agoranode/src/AccessToken').priviledges;
const appID = '935eba5556684feca651aebec53b4879';
const appCertificate = 'd7508f79155048efb35932a96b6da101';
const account = "test_user_id";

const expirationTimeInSeconds = 3600
const currentTimestamp = Math.floor(Date.now() / 1000)

const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

const token = RtmTokenBuilder.buildToken(appID, appCertificate, account, RtmRole, privilegeExpiredTs);
console.log("Rtm Token: " + token);
