import "webrtc-adapter";
import EventEmitter from "events";
import MediaStreamRecorder from "msr";
import getUserMedia from "getusermedia";
import merge from "lodash/merge";
import debounce from "lodash/debounce";

/**
 * reference: @see {@link https://github.com/FairyDevicesRD/mimi.tagengo.examples/tree/master/src/JavaScript}
 *
 * mimi ASR api:
 * @see {@link https://mimi.readme.io/reference/mimi-asr}
 * @see {@link https://mimi.readme.io/reference/mimi-asr-powered-by-nict}
 * @see {@link https://mimi.readme.io/reference/mimi-asr}
 *
 * http header參數對應的websocket query string參考
 * @see {@link https://mimi.readme.io/docs/use-query}
 *
 */
export default class MimiASR extends EventEmitter {
  /**
   * @type {MediaStreamRecorder|undefined}
   * @protected
   */
  _mediaRecorder;

  /**
   * @type {Function}
   * @protected
   */
  _recognizedDebounce;

  /**
   * @type {Websocket|undefined}
   * @protected
   */
  _socket;

  /**
   * mimi ASR websocket api的參數
   *
   * @type {Object}
   * @protected
   */
  _params = {};

  /**
   * @type {Object}
   * @protected
   */
  _config = {
    baseUrl: "wss://service.mimi.fd.ai/",
    mediaRecord: {
      interval: 300, // [interval] ms要送出一次[interval] ms內擷取的blob
    },
    speakDebounce: 4000, // 超過[speakDebounce]ms就觸發recognized事件
  };

  /**
   *
   * socket是否由stop方法主動關閉 (socket可能由mimi ASR服務主動關閉)
   *
   * @type {boolean}
   * @protected
   */
  _socketClosedActive = false;

  /**
   * @type {string}
   * @protected
   *
   * 當前最後一次的結果
   */
  _lastResult;

  constructor(params, config = null) {
    super();

    if (config instanceof Object) this._config = merge(this._config, config);

    this._params = params;
  }

  _generateUrl() {
    return (
      this._config.baseUrl + "?" + new URLSearchParams(this._params).toString()
    );
  }

  updateAccessToken(accessToken) {
    this._config["access-token"] = accessToken;
  }

  start() {
    this.stop();
    this._socketClosedActive = false;

    this._socket = new WebSocket(this._generateUrl());

    this._socket.onopen = async (e) => {
      console.log(e);
      try {
        const stream = await new Promise((resolve, reject) => {
          getUserMedia({ audio: true }, function (err, stream) {
            if (err) {
              reject(err);
            } else {
              resolve(stream);
            }
          });
        });

        this._mediaRecorder = this._createMediaRecorder(stream);
        this._mediaRecorder.start(this._config.mediaRecord.interval);
      } catch (err) {
        console.error(err);
      }
    };

    this._socket.onmessage = (event) => {
      console.log(event);
      // mimi ASR response
      const data = JSON.parse(event.data);
      const text = data?.response[0]?.result;
      this._lastResult = text;
      this.emit("recognizing", text);

      if (!this._recognizedDebounce) {
        this._recognizedDebounce = debounce(() => {
          if (this._lastResult) this.emit("recognized", this._lastResult);

          this._recognizedDebounce = undefined;
        }, this._config.speakDebounce);
      }

      this._recognizedDebounce();
    };

    this._socket.onerror = (event) => {
      console.error(event);
      this._mediaRecorder?.stop();
    };

    this._socket.onclose = (event) => {
      console.log(event);
      this._mediaRecorder?.stop();

      if (
        !this._socketClosedActive &&
        event instanceof CloseEvent &&
        event.code == 4003
      ) {
        // mimi ASR 服務超時關閉socket
        this.start(); // 重新連接
      }
    };
  }

  stop() {
    this._mediaRecorder?.stop();
    this._socket?.close();
    this._socketClosedActive = true;
    this._attemptSocketSend('{"command":"recog-break"}'); // 通知mimi asr 服務結束了，關閉websocket連線
  }

  /**
   * @param {MediaStream} stream
   * @returns {MediaStreamRecorder}
   */
  _createMediaRecorder(stream) {
    const mediaRecorder = new MediaStreamRecorder(stream);
    mediaRecorder.audioChannels = 1;
    mediaRecorder.mimeType = "audio/pcm";
    mediaRecorder.ondataavailable = (blob) => this._attemptSocketSend(blob); // 把錄音給mimi asr 服務解析

    return mediaRecorder;
  }

  _attemptSocketSend(data) {
    if (this._isSocketOpening()) this._socket?.send(data);
  }

  // 有socket&socket狀態是opening
  _isSocketOpening() {
    return this._socket?.readyState == 1;
  }
}
