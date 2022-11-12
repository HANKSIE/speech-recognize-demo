import axios from "axios";

export default class AzureTRA {
  _sourceLang;
  _targetLangs;
  _authorizationToken;
  _url = "https://api.cognitive.microsofttranslator.com/translate";

  constructor(authorizationToken, targetLangs, sourceLang) {
    this._authorizationToken = authorizationToken;
    this._targetLangs = targetLangs;
    this._sourceLang = sourceLang;
  }

  async translate(text) {
    try {
      const res = await axios.post(
        this._url,
        [
          {
            text,
          },
        ],
        {
          headers: {
            Authorization: "Bearer " + this._authorizationToken,
            "Content-type": "application/json",
          },
          params: {
            "api-version": "3.0",
            from: this._sourceLang,
            to: this._targetLangs,
          },
        }
      );

      //   const res = axios({
      //     baseURL: "https://api.cognitive.microsofttranslator.com",
      //     url: "/translate",
      //     method: "post",
      //     headers: {
      //       "Ocp-Apim-Subscription-Key": this._subscriptionKey,
      //       // location required if you're using a multi-service or regional (not global) resource.
      //       "Ocp-Apim-Subscription-Region": this._subscriptionRegion,
      //       "Content-type": "application/json",
      //       "X-ClientTraceId": v4().toString(),
      //     },
      //     params: {
      //       "api-version": "3.0",
      //       from: this._sourceLang,
      //       to: this._targetLangs,
      //     },
      //     data: [
      //       {
      //         text: "I would really like to drive your car around the block a few times!",
      //       },
      //     ],
      //     responseType: "json",
      //   });
      return res.data;
    } catch (err) {
      console.error(err);
    }
  }
}
