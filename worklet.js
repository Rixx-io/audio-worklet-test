const MESSAGE_INTERVAL = 0.1

class PeakMeter extends AudioWorkletProcessor {

  lastTime = 0
  peak = 0

  process (inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]
    if (!input || !output) return false

    const inCh = input[0]
    if (!inCh) return false

    output.forEach(outCh => {
      for (let i = 0; i < outCh.length; i++) {
        outCh[i] = inCh[i]
        if (Math.abs(inCh[i]) > this.peak) {
          this.peak = Math.abs(inCh[i])
        }
      }
    })

    if (currentTime - this.lastTime > MESSAGE_INTERVAL) {
      this.port.postMessage(this.peak)
      this.peak = 0
      this.lastTime = currentTime
    }

    return true
  }
}

registerProcessor('peak-meter', PeakMeter)
