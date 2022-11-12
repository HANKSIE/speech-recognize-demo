import axios from "axios";

export default class MimiTRA {
  /**
   * @type {string}
   * @protected
   */
  _accessToken;

  /**
   *
   * mimi TRA api params without "text" field
   * @see {@link https://mimi.readme.io/reference/machine-translation}
   *
   * @type {Object}
   * @protected
   */
  _params;

  /**
   * @type {string}
   * @protected
   */
  _url = "https://tra.mimi.fd.ai/machine_translation";

  constructor(accessToken, params) {
    this._accessToken = accessToken;
    this._params = params;
  }

  updateAccessToken(accessToken) {
    this._accessToken = accessToken;
  }

  async translate(text) {
    try {
      const data = {
        ...this._params,
        ...{
          text,
        },
      };

      const formData = Object.entries(data).reduce((formData, [k, v]) => {
        formData.append(k, v);
        return formData;
      }, new FormData());

      const res = await axios.post(this._url, formData, {
        headers: {
          accept: "application/json",
          Authorization: "Bearer " + this._accessToken,
        },
      });
      return await res.data;
    } catch (err) {
      console.error(err);
    }
  }
}
