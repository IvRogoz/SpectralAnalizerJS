let audioContext;
let analyserLeft;
let analyserRight;
let dataArrayLeft;
let dataArrayRight;
let bufferLength;
let sourceNode;

function getBarFillStyle(barHeight, alpha) {
	const green = [0, 255, 0]; // RGB for green
	const orange = [255, 165, 0]; // RGB for orange
	const ratio = Math.min(barHeight / (HEIGHT/2), 1);
	const interpolatedColor = green.map((component, index) => {
		return Math.round(component + (orange[index] - component) * ratio);
	});
	return `rgba(${interpolatedColor.join(',')},${alpha})`;
}

function getBarFillStyle2(barHeight, alpha) {
	const red = [255, 0, 0]; // RGB for red
	const orange = [255, 165, 0]; // RGB for orange
	const ratio = Math.min(barHeight / (HEIGHT/2), 1);
	const interpolatedColor = red.map((component, index) => {
		return Math.round(component + (orange[index] - component) * ratio);
	});
	return `rgba(${interpolatedColor.join(',')},${alpha})`;
}

// Set up the canvas context for drawing
const canvas = document.getElementById("vuMeter");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const centerX = WIDTH / 2;

let historyLeft = new Array(WIDTH / 2).fill(0);
let historyRight = new Array(WIDTH / 2).fill(0);

function draw() {
	requestAnimationFrame(draw);

	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	analyserLeft.getByteFrequencyData(dataArrayLeft);
	analyserRight.getByteFrequencyData(dataArrayRight);

	let leftAverage = dataArrayLeft.reduce((a, b) => a + b, 0) / bufferLength;
	let rightAverage = dataArrayRight.reduce((a, b) => a + b, 0) / bufferLength;

	historyLeft.unshift(leftAverage);
	historyRight.unshift(rightAverage);
	historyLeft.pop();
	historyRight.pop();

	for (let i = 0; i < historyLeft.length; i++) {
		let alpha = 1 - (i / 95);
		let colorStyleLeft = getBarFillStyle(historyLeft[i], alpha);
		ctx.fillStyle = colorStyleLeft;
		ctx.fillRect(centerX - 3 * (i + 1), (HEIGHT - historyLeft[i]) - 150, 1, historyLeft[i]);
		ctx.fillRect(centerX - 3 * (i + 1), (HEIGHT + historyLeft[i]) - 150, 1, -historyLeft[i]);
	}

	for (let i = 0; i < historyRight.length; i++) {
		let alpha = 1 - (i / 95);
		let colorStyleRight = getBarFillStyle2(historyRight[i], alpha);
		ctx.fillStyle = colorStyleRight;
		ctx.fillRect(centerX + 3 * (i + 1), (HEIGHT - historyRight[i]) - 150, 1, historyRight[i]);
		ctx.fillRect(centerX + 3 * (i + 1), (HEIGHT + historyRight[i]) - 150, 1, -historyRight[i]);
	}

	let colorStyleRight = getBarFillStyle2(rightAverage, 1);
	ctx.fillStyle = colorStyleRight;
	ctx.fillRect(centerX + rightAverage + 150, 0, 20, HEIGHT);

	let colorStyleLeft = getBarFillStyle(leftAverage, 1);
	ctx.fillStyle = colorStyleLeft;
	ctx.fillRect(centerX - leftAverage - 20 - 150, 0, 20, HEIGHT);

	// Draw center line
	ctx.strokeStyle = 'white';
	ctx.beginPath();
	ctx.moveTo(centerX, 0);
	ctx.lineTo(centerX, HEIGHT);
	ctx.stroke();
}

document.getElementById('fileInput').addEventListener('change', function (event) {
	const file = this.files[0];
	if (file) {
		// If there is an existing audio context, close it before creating a new one
		if (audioContext) {
			audioContext.close();
		}
		audioContext = new (window.AudioContext || window.webkitAudioContext)();
		analyserLeft = audioContext.createAnalyser();
		analyserRight = audioContext.createAnalyser();

		analyserLeft.fftSize = 256;
		analyserRight.fftSize = 256;
		bufferLength = analyserLeft.frequencyBinCount;
		dataArrayLeft = new Uint8Array(bufferLength);
		dataArrayRight = new Uint8Array(bufferLength);

		const reader = new FileReader();
		reader.onload = function (e) {
			audioContext.decodeAudioData(e.target.result, function (buffer) {
				if (sourceNode) {
					sourceNode.disconnect();
				}
				sourceNode = audioContext.createBufferSource();
				sourceNode.buffer = buffer;

				const splitter = audioContext.createChannelSplitter(2);
				sourceNode.connect(splitter);
				splitter.connect(analyserLeft, 0, 0);
				splitter.connect(analyserRight, 1, 0);
				analyserLeft.connect(audioContext.destination);
				analyserRight.connect(audioContext.destination);

				sourceNode.start();
				draw(); // Start the drawing loop
			}, function (err) {
				alert("Error with decoding audio data: " + err.err);
			});
		};
		reader.readAsArrayBuffer(file);
	}
});