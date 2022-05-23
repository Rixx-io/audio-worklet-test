const MESSAGE_INTERVAL = 0.1

class PeakMeter extends AudioWorkletProcessor {

  lastTime = 0
  peak = 0

  process (inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]

    // bypass audio
    for (let channel = 0; channel < output.length; ++channel) {
      output[channel].set(input[channel]);
    }

    // find peak
    this.peak = Math.max(this.peak, ...input[0].map(s => Math.abs(s)))

    // periodically report peak
    if (currentTime - this.lastTime > MESSAGE_INTERVAL) {
      this.port.postMessage(this.peak)
      this.peak = 0
      this.lastTime = currentTime
    }

    return true
  }
}

registerProcessor('peak-meter', PeakMeter)
