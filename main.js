console.log('start of main.js')

const micCheckbox = document.getElementById('mic-checkbox')
const workletCheckbox = document.getElementById('worklet-checkbox')
const initButton = document.getElementById('init-button')
const closeButton = document.getElementById('close-button')
const inputGain = document.getElementById('input-gain')
const oscillatorGain = document.getElementById('oscillator-gain')
const peakMeter = document.getElementById('peak-meter')

initButton.addEventListener('click', event => {
    event.preventDefault()
    initButton.disabled = true
    closeButton.disabled = false
    initAudio()
})
closeButton.addEventListener('click', event => {
    event.preventDefault()
    initButton.disabled = false
    closeButton.disabled = true
    audioContext.close()
    audioContext = null
})

let audioContext

async function initAudio () {
    if (audioContext) throw new Error('audio context already inited')

    audioContext = new AudioContext()
    audioContext.suspend()

    let inputGainNode
    if (micCheckbox.checked) {
        console.log('creating mic input node')
        // Always call getUserMedia even if not using mic input, or else oscillator doesn't work either
        const inputStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        const inputNode = new MediaStreamAudioSourceNode(audioContext, { mediaStream: inputStream })
        inputGainNode = new GainNode(audioContext, { gain: parseFloat(inputGain.value) })
        inputNode.connect(inputGainNode)
        inputGain.addEventListener('input', () => { inputGainNode.gain.value = parseFloat(inputGain.value) })
    }

    let peakMeterNode
    if (workletCheckbox.checked) {
        console.log('adding module worklet.js')
        await audioContext.audioWorklet.addModule('worklet.js')

        // try delaying after adding worklet module… doesn't help
        // await new Promise((resolve, reject) => {
        //     setTimeout(resolve, 2000)
        // })

        console.log('creating worklet node')
        peakMeterNode = new AudioWorkletNode(audioContext, 'peak-meter')
        peakMeterNode.port.onmessage = event => {
            // console.log('onmessage', event.data)
            const peak = event.data
            peakMeter.value = peak
        }
        peakMeterNode.onprocessorerror = event => {
            console.error('processor error', event)
        }
    } else {
        // fake peak meter node is just a unity gain passthrough
        peakMeterNode = new GainNode(audioContext)
    }
    peakMeterNode.connect(audioContext.destination)
    if (inputGainNode) {
        inputGainNode.connect(peakMeterNode)
    }

    const oscillatorNode = new OscillatorNode(audioContext)
    const oscillatorGainNode = new GainNode(audioContext, { gain: parseFloat(oscillatorGain.value) })
    oscillatorGain.addEventListener('input', () => { oscillatorGainNode.gain.value = parseFloat(oscillatorGain.value) })
    oscillatorNode.connect(oscillatorGainNode).connect(peakMeterNode)
    oscillatorNode.start()

    audioContext.resume()
}
