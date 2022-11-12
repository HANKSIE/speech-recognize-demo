// import MimiASR from "./speech-recoginize/mimi/asr";
// import MimiTRA from "./speech-recoginize/mimi/tra";

// (async () => {
//   const app_id = "a2e7081b64e84b8bb5bb20187108aa8f";
//   const app_secret =
//     "ab3a3b9ed2b32fbaa906107059136aa53a0e8f6993ea6a540a1f22818d43b18409a2723c34052c1be56150daf6533c80391a6150dd5be2a82ef61ccf990ddf2d495e3f630096f8fc46187ad597cfd0c39dd7754b43397d8a9a29a4702f7996339005e49cb8851e2ea0ca300b519b40ec0e189137462620fbdf68977e0ee0c4e550793b5ca7379f7fd1b736745b1bdfe3b0b56f8edfb62adfacea6bfe310ddcb5a42fce236969ddddfe30d0f5ef2fbf94ac8f15d5983acb46b5ff5a2787d31d934195855750d3b85d28ce2c41600044dfc7dfe693abe8f552d5570de06325ee3b6ce9bad9f6857edd007e7dd5fbeb6aecc9107c3181fe8f2052799cef086a875e";

//   const accessToken = await getAccessToken(app_id, app_secret);

//   const asr = new MimiASR({
//     "access-token": accessToken,
//     "input-language": "zh-TW",
//     "content-type": "audio/x-pcm;bit=16;rate=44100;channels=1",
//     process: "nict-asr",
//     "nict-asr-options":
//       "response_format=v2;progressive=true;temporary=true;temporary_interval=300",
//   });
//   // const tra = new MimiTRA(accessToken, {
//   //   source_lang: "zh-TW",
//   //   target_lang: "ja",
//   // });

//   asr.on("recognizing", async (text) => {
//     console.log("recognizing: ", text);
//     // console.log("translate: ", await tra.translate(text));
//   });

//   asr.on("recognized", async (text) => {
//     console.log("recognized: ", text);
//     // console.log("translate: ", await tra.translate(text));
//   });

//   document.getElementById("start_btn").addEventListener("click", function () {
//     asr.start();
//   });

//   document.getElementById("stop_btn").addEventListener("click", function () {
//     asr.stop();
//   });
// })();

// async function getAccessToken(app_id, app_secret) {
//   const AUTH_SERVER_URI = "https://auth.mimi.fd.ai/v2/token";
//   const SCOPE =
//     "https://apis.mimi.fd.ai/auth/nict-asr/websocket-api-service;https://apis.mimi.fd.ai/auth/nict-tra/http-api-service";

//   const response = await fetch(AUTH_SERVER_URI, {
//     method: "POST",
//     body: new URLSearchParams({
//       client_id: app_id,
//       client_secret: app_secret,
//       grant_type: "https://auth.mimi.fd.ai/grant_type/application_credentials",
//       scope: SCOPE,
//     }),
//   });

//   if (!response.ok) {
//     throw Error("failed to issue an access token");
//   }

//   const data = await response.json();
//   const token = data["accessToken"];

//   return token;
// }

//====================================================================

/**
 *
 * azure
 *
 */
import AzureASR from "./speech-recoginize/azure/asr";
import AzureTRA from "./speech-recoginize/azure/tra";

(async () => {
  const authorizationToken = "";

  const azureTRA = new AzureTRA(authorizationToken, "zh-TW", "en-US");

  console.log(await azureTRA.translate("你好"));
  // const azureAsr = new AzureASR(
  //   "AuthorizationToken",
  //   "zh-TW",
  //   authorizationToken,
  //   "japaneast"
  // );
  // azureAsr.on("recognizing", (text) => console.log("recognizing: ", text));
  // azureAsr.on("recognized", (text) => console.log("recognized: ", text));

  // document.getElementById("start_btn").addEventListener("click", function () {
  //   azureAsr.start();
  // });

  // document.getElementById("stop_btn").addEventListener("click", function () {
  //   azureAsr.stop();
  // });
})();
