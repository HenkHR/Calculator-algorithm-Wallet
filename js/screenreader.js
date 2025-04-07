window.addEventListener("load", init);

//globals
let screenReaderButton
let speech

function init(){
    //De variabelen initialiseren
    screenReaderButton = document.querySelector("#screen-reader-button")

    //Event listeners
    screenReaderButton.addEventListener("click", screenReader)
}

function screenReader(){
    cancelSpeech()
    readAllText()
}

function readAllText(){
    let content = document.body.innerText
    speech = new SpeechSynthesisUtterance(content)
    speech.lang = 'nl-NL'

    window.speechSynthesis.speak(speech)
}

function cancelSpeech(){
    if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel()
        }
}