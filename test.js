const AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContext();
var distortionanalyser = audioContext.createAnalyser();
var freqdial = document.querySelector('#freq');
var distortdial = document.querySelector('#distort');
var oscanalyser = audioContext.createAnalyser();
var lfoanalyser = audioContext.createAnalyser();
var lfogainanalyser = audioContext.createAnalyser();
var analyserAnimations = [null, null, null, null];

function refloat(a64) {
  var a32 = new Float32Array(a64.length);
  for (var i = 0; i < a64.length; i++) {
    a32[i] = a64[i];
  }

  return a32;
}

function makeDistortionCurve(amount) {
  var k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) ) * 2;
  }
  return curve;
};

function sharkFin(x) {
  if (x < 0) return 0;
  x = x * 2 % 2 + 0.05;
  if (x < 1) {
    return  1 + Math.log(x) / 4;
  }
  return Math.pow(-x, -2);
}

var count = 128;
var sharkFinValues = new Float32Array(count);
for (var i = 0; i < count; i++) {
  sharkFinValues[i] = sharkFin(i/count);
}
var ft = new DFT(sharkFinValues.length);
ft.forward(sharkFinValues);

var lfoTable = audioContext.createPeriodicWave(refloat(ft.real), refloat(ft.imag));

var playing = 0;

function toggle() {
  if (playing) {
    stop();
    playing = 0;
  } else {
    play();
    playing = 1;
  }
}

function slide(value) {
  osc.frequency.value = value;
}

function play() {
  osc = audioContext.createOscillator();
  osc.frequency.value = freqdial.value;

  lfo = audioContext.createOscillator();
  lfo.setPeriodicWave(lfoTable);
  lfo.frequency.value = 1/0.380;

  lfoGain = audioContext.createGain();
  lfoGain.gain.value = 450;

  distortion = audioContext.createWaveShaper();
  distortion.curve = makeDistortionCurve(distortdial.value);
  distortion.oversample = '4x';

  osc.connect(distortion);

  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  distortion.connect(audioContext.destination);

  distortion.connect(distortionanalyser);
  draw(3, distortionanalyser, '#distortionvisualiser');

  osc.connect(oscanalyser);
  draw(0, oscanalyser, '#oscvisualiser');

  lfo.connect(lfoanalyser);
  draw(1, lfoanalyser, '#lfovisualiser');

  lfoGain.connect(lfogainanalyser);
  draw(2, lfogainanalyser, '#lfogainvisualiser');

  osc.start(0);
  lfo.start(0);
}

function distort(value) {
  newval = parseInt(value, 10);
  distortion.curve = makeDistortionCurve(newval);
  drawwave('#distortvis', makeDistortionCurve(newval));
}

function drawwave(selector, array) {
  canvasCtx = document.querySelector(selector).getContext("2d");

  var WIDTH = 640;
  var HEIGHT = 100;

  dataArray = array;
  var bufferLength = array.length;

  // background
  canvasCtx.fillStyle = 'rgb(200, 200, 200)';
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

  // configure line
  canvasCtx.lineWidth = 2;
  canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
  canvasCtx.beginPath();

  var sliceWidth = WIDTH * 1.0 / bufferLength;
  var x = 0;

  for(var i = 0; i < bufferLength; i++) {
    var v = dataArray[i] * 40.0;
    var y = HEIGHT/2 + v;

    if(i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  canvasCtx.lineTo(640, 50);
  canvasCtx.stroke();
}

drawwave('#wavevis', sharkFinValues);
drawwave('#distortvis', makeDistortionCurve(0));

function draw(n, analyser, canvasSelector) {
  var bufferLength = analyser.fftSize;
  dataArray = new Float32Array(bufferLength);
  canvasElement = document.querySelector(canvasSelector);
  canvasCtx = canvasElement.getContext("2d");

  function drawrec(n, analyser, canvasCtx, dataArray) {
    function closure() {
      var WIDTH = 640;
      var HEIGHT = 100;
      var bufferLength = analyser.fftSize;

      analyserAnimations[n] = requestAnimationFrame(closure);
      analyser.getFloatTimeDomainData(dataArray);

      // background
      canvasCtx.fillStyle = 'rgb(200, 200, 200)';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      // configure line
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
      canvasCtx.beginPath();

      var sliceWidth = WIDTH * 1.0 / bufferLength;
      var x = 0;

      for(var i = 0; i < bufferLength; i++) {
        var v = dataArray[i] * 20.0;
        var y = HEIGHT/2 + v;

        if(i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(640, 50);
      canvasCtx.stroke();
    }
    closure();
  }

  drawrec(n, analyser, canvasCtx, dataArray);
}

function stop() {
  osc.disconnect();
  distortion.disconnect();
  lfoGain.disconnect();
  lfo.disconnect();
  distortionanalyser.disconnect();
  oscanalyser.disconnect();
  lfoanalyser.disconnect();
  lfogainanalyser.disconnect();
  analyserAnimations.forEach(analyserAnimation => {
    window.cancelAnimationFrame(analyserAnimation);
  });
}
