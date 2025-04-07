window.addEventListener("load", init);

//globale variabelen
let htmlList
let clearButton
let form
let list = [];

//Een functie die de initializatie van de pagina regelt
function init() {
    //De variabelen initialiseren
    htmlList = document.querySelector("#boodschappenlijst")
    clearButton = document.querySelector("#clear-button")
    form = document.querySelector("#boodschappen-form")

    //Event listeners
    form.addEventListener("submit", addItems)
    htmlList.addEventListener("click", strikeOut)
    clearButton.addEventListener("click", clearList)

    //De boodschappenlijst weergeven
    listItems()
}

//Een functie die de boodschappenlijst opslaat in local storage
function saveList() {
    localStorage.removeItem("boodschappenlijst")
    localStorage.setItem("boodschappenlijst", JSON.stringify(list))
}

//Een functie die de boodschappenlijst weergeeft
function listItems() {
    htmlList.innerHTML = ""
    // Get the list from localStorage or use the global list array
    list = JSON.parse(localStorage.getItem('boodschappenlijst')) || [];

    // Ensure list is an array
    if (!Array.isArray(list)) {
        list = [];
    }

    list.forEach(item => {
        let li = document.createElement("li")
        li.textContent = item
        li.setAttribute("aria-label", item)
        htmlList.appendChild(li)
    })
}

//Een functie die een item toevoegt aan de boodschappenlijst
function addItems(e) {
    e.preventDefault()
    let input = document.querySelector("#boodschap")
    if (input.value !== "") {
        // Add to the global list array
        list.push(input.value)
        // Save to localStorage
        saveList()
        // Update the display
        listItems()
        // Clear the input
        input.value = ""
    }
}

//Een functie die een item van de boodschappenlijst afstreept
function strikeOut(e) {
    let li = e.target
    if (li.tagName === "LI") {
        li.classList.toggle("strike")
    }
}

//Een functie die de boodschappenlijst leegt
function clearList() {
    while (htmlList.hasChildNodes()) {
        htmlList.removeChild(htmlList.firstChild)
    }
    list = []
    localStorage.removeItem("boodschappenlijst")
    localStorage.setItem("boodschappenlijst", JSON.stringify(list))
}