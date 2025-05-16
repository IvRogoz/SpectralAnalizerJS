if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  alert("Your browser does not support the Media Devices API");
} else {
  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then((stream) => {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const analyserLeft = audioContext.createAnalyser();
      const analyserRight = audioContext.createAnalyser();

      analyserLeft.fftSize = 256;
      analyserRight.fftSize = 256;

      const bufferLength = analyserLeft.frequencyBinCount;
      const dataArrayLeft = new Uint8Array(bufferLength);
      const dataArrayRight = new Uint8Array(bufferLength);
      const splitter = audioContext.createChannelSplitter(2);

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(splitter);
      splitter.connect(analyserLeft, 0, 0);
      splitter.connect(analyserRight, 1, 0);

      const canvas = document.getElementById("vuMeter");
      const ctx = canvas.getContext("2d");

      const canvas2 = document.getElementById("vuMeter2");
      const ctx2 = canvas2.getContext("2d");

      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;
      const centerX = WIDTH / 2;

      let historyLeft = new Array(WIDTH / 2).fill(0);
      let historyRight = new Array(WIDTH / 2).fill(0);

      function getBarFillStyle(barHeight, alpha) {
        const green = [0, 255, 0]; // RGB for green
        const orange = [255, 165, 0]; // RGB for orange
        const ratio = Math.min((barHeight * 2) / HEIGHT, 1);
        const interpolatedColor = green.map((component, index) => {
          return Math.round(component + (orange[index] - component) * ratio);
        });

        return `rgba(${interpolatedColor.join(",")},${alpha})`;
      }

      function getBarFillStyle2(barHeight, alpha) {
        const red = [255, 0, 0]; // RGB for red
        const orange = [255, 165, 0]; // RGB for orange
        const ratio = Math.min((barHeight * 2) / HEIGHT, 1);
        const interpolatedColor = red.map((component, index) => {
          return Math.round(component + (orange[index] - component) * ratio);
        });

        return `rgba(${interpolatedColor.join(",")},${alpha})`;
      }

      function draw() {
        requestAnimationFrame(draw);

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx2.fillStyle = "black";
        ctx2.fillRect(0, 0, WIDTH, HEIGHT);

        analyserLeft.getByteFrequencyData(dataArrayLeft);
        analyserRight.getByteFrequencyData(dataArrayRight);

        let leftAverage =
          dataArrayLeft.reduce((a, b) => a + b, 0) / bufferLength;
        let rightAverage =
          dataArrayRight.reduce((a, b) => a + b, 0) / bufferLength;

        historyLeft.unshift(leftAverage);
        historyRight.unshift(rightAverage);
        historyLeft.pop();
        historyRight.pop();

        const barWidth = 20;
        const leftBarHeight = leftAverage * 2;
        const rightBarHeight = rightAverage * 2;

        for (let i = 0; i < historyLeft.length; i++) {
          let alpha = 1 - i / 95;
          let colorStyleLeft = getBarFillStyle(historyLeft[i], alpha);

          ctx.fillStyle = colorStyleLeft;
          ctx.fillRect(
            centerX - 3 * (i + 1),
            HEIGHT - historyLeft[i] * 2,
            1,
            historyLeft[i] * 2
          );

          ctx2.fillStyle = colorStyleLeft;
          ctx2.fillRect(centerX - 3 * (i + 1), 0, 1, historyLeft[i] * 2);
        }

        for (let i = 0; i < historyRight.length; i++) {
          let alpha = 1 - i / 95;
          let colorStyleRight = getBarFillStyle2(historyRight[i], alpha);

          ctx.fillStyle = colorStyleRight;
          ctx.fillRect(
            centerX + 3 * (i + 1),
            HEIGHT - historyRight[i] * 2,
            1,
            historyRight[i] * 2
          );

          ctx2.fillStyle = colorStyleRight;
          ctx2.fillRect(centerX + 3 * (i + 1), 0, 1, historyRight[i] * 2);
        }

        let colorStyleRight = getBarFillStyle2(rightBarHeight, 1);
        ctx.fillStyle = colorStyleRight;
        ctx.fillRect(
          centerX,
          HEIGHT - rightBarHeight,
          barWidth,
          rightBarHeight
        );
        ctx2.fillStyle = colorStyleRight;
        ctx2.fillRect(centerX, 0, barWidth, rightBarHeight);

        let colorStyleLeft = getBarFillStyle(leftBarHeight, 1);
        ctx.fillStyle = colorStyleLeft;
        ctx.fillRect(
          centerX - barWidth,
          HEIGHT - leftBarHeight,
          barWidth,
          leftBarHeight
        );
        ctx2.fillStyle = colorStyleLeft;
        ctx2.fillRect(centerX - barWidth, 0, barWidth, leftBarHeight);

        // // Draw center line
        // ctx.strokeStyle = 'white';
        // ctx.beginPath();
        // ctx.moveTo(centerX, 0);
        // ctx.lineTo(centerX, HEIGHT);
        // ctx.stroke();
      }

      draw();
    })
    .catch((err) => {
      alert("Error accessing the microphone: " + err.message);
    });
}