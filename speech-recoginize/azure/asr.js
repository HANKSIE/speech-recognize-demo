import EventEmitter from "events";
import {
  SpeechConfig,
  AudioConfig,
  SpeechRecognizer,
  ResultReason,
  CancellationDetails,
} from "microsoft-cognitiveservices-speech-sdk";

/**
 * reference: @see {@link https://learn.microsoft.com/zh-tw/azure/cognitive-services/speech-service/how-to-recognize-speech?pivots=programming-language-javascript}
 */
export default class AzureASR extends EventEmitter {
  /**
   * @type {SpeechConfig}
   * @protected
   */
  _speechConfig;

  /**
   * @type {AudioConfig}
   * @protected
   */
  _audioConfig;

  /**
   * @type {SpeechRecognizer}
   * @protected
   */
  _recognizer;

  _sourceLang;

  /**
   * @param {('AuthorizationToken'|'Endpoint'|'Host'|'Subscription')} authType
   * @param {string} sourceLang
   * @param  {...string} args
   */
  constructor(authType, sourceLang, ...args) {
    super();
    this._speechConfig = Reflect.get(SpeechConfig, `from${authType}`)(...args);

    this._sourceLang = sourceLang;
    this._speechConfig.speechRecognitionLanguage = this._sourceLang;
    this._audioConfig = AudioConfig.fromDefaultMicrophoneInput();
    this._recognizer = new SpeechRecognizer(
      this._speechConfig,
      this._audioConfig
    );

    this._recognizer.recognizing = (s, e) =>
      this.emit("recognizing", e.result.text);

    this._recognizer.recognized = (s, e) => {
      switch (e.result.reason) {
        case ResultReason.RecognizedSpeech:
          this.emit("recognized", e.result.text);
          break;
        case ResultReason.NoMatch:
          this.emit("recognized_nomatch", e.result.text);
          break;
        case ResultReason.Canceled:
          const cancellation = CancellationDetails.fromResult(result);
          this.emit("recognized_canceled", cancellation.reason);
          break;
      }
    };

    this._recognizer.canceled = (s, e) => {
      this.emit("canceled", e.reason);
      this.stop();
    };
  }

  start() {
    this._recognizer.startContinuousRecognitionAsync();
  }

  stop() {
    this._recognizer.stopContinuousRecognitionAsync();
  }
}
