let audio_context;
let recorder;

function arrayBufferToBase64(buffer) {
    let binary = '';
    let bytes = new Float32Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function startUserMedia(stream) {
    let input = audio_context.createMediaStreamSource(stream);

    recorder = new Recorder(input);
}


let startRecording = function () {
    audio_context.resume()
    recorder && recorder.record();
    console.log("record start")
};

let endRecording = function () {
    recorder && recorder.stop();
    console.log("record stop");

    // create WAV download link using audio data blob
    audioRecognize();

    recorder.clear();
};

function audioRecognize() {
    recorder && recorder.exportWAV(function (blob) {
        let reader = new FileReader();
        reader.onload = function () {
            let result = new Uint8Array(reader.result); // reader.result is ArrayBuffer
            let data = {
                "config": {
                    "encoding": "LINEAR16",
                    "sampleRateHertz": 44100,
                    "languageCode": "ja-JP"
                },
                "audio": {
                    "content": arrayBufferToBase64(result)
                }
            };
            console.log("audio send...");
            fetch('https://speech.googleapis.com/v1/speech:recognize?key=' + apiKey, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(data)
            }).then(function (response) {
                return response.text();
            }).then(function (text) {
                let result_json = JSON.parse(text);
                //ここに処理
                //テキストデータ自体はresult_json.results[0].alternatives[0].transcriptに格納
                console.log("RESULT: " + text);
                console.log(result_json.results[0].alternatives[0].transcript);
                console.log(data)
            });
        };
        reader.readAsArrayBuffer(blob)

    });
}

window.onload = function init() {
    try {
        // webkit shim
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
        window.URL = window.URL || window.webkitURL;

        audio_context = new AudioContext();
    } catch (e) {
        alert('No web audio support in this browser!');
    }

    navigator.getUserMedia({audio: true}, startUserMedia, function (e) {
    });
};
