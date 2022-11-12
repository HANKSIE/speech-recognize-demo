import "webrtc-adapter";
import EventEmitter from "events";
import MediaStreamRecorder from "msr";
import getUserMedia from "getusermedia";
import { merge, debounce, DebouncedFunc } from "lodash";

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
    waitRecognizing: 6000, // 超過[waitRecognizing]ms就送出recog-break command
  };

  _isStop = false;

  _hasSendRecogBreakCommand = false;

  /**
   * @type {DebouncedFunc<(...args: any[]) => any>}
   * @protected
   */
  _recognizedDebounce = undefined;

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

  /**
   *
   * @param {('recognizing'|'recognized')} eventName
   * @param {(...args: any[]) => void} listener
   */
  on(eventName, listener) {
    super.on(eventName, listener);
  }

  updateAccessToken(accessToken) {
    this._config["access-token"] = accessToken;
  }

  _reset() {
    this._mediaRecorder?.stop();
    this._socket?.close();
    this._hasSendRecogBreakCommand = false;
    this._recognizedDebounce = undefined;
  }

  stop() {
    this._reset();
    this._isStop = true;
  }

  start() {
    this._reset();
    this._connect();
  }

  _connect() {
    this._isStop = false;

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
      // mimi ASR response
      const data = JSON.parse(event.data);
      const text = data?.response[0]?.result;

      switch (data.status) {
        case "recog-in-progress":
          this.emit("recognizing", text);
          break;
        case "recog-finished":
          this.emit("recognized", text);
          break;
      }

      if (
        !this._hasSendRecogBreakCommand &&
        this._recognizedDebounce === undefined
      ) {
        this._recognizedDebounce = debounce(() => {
          this._attemptSocketSend('{"command":"recog-break"}');
          this._hasSendRecogBreakCommand = true;
          this._recognizedDebounce = undefined;
          this._mediaRecorder.stop(); // 避免重複送出 recog-break
        }, this._config.waitRecognizing);
      }

      if (this._recognizedDebounce !== undefined) this._recognizedDebounce();
    };

    this._socket.onerror = (event) => {
      console.error(event);
      this._mediaRecorder?.stop();
    };

    this._socket.onclose = (event) => {
      console.log(event);
      this._mediaRecorder?.stop();

      if (
        !this._isStop &&
        event instanceof CloseEvent &&
        // 超時關閉或4003 => 超時關閉; 1000 => 送出recog-break正常關閉
        (event.code == 4003 || event.code == 1000)
      ) {
        console.log("reconnect mimi ASR service");
        this.start(); // 重新連接
      }
    };
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
