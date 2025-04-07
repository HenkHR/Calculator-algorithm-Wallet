// Laad en bewaar portemonnee gegevens
let portemonnee = JSON.parse(localStorage.getItem('portemonnee')) || [];
let wisselgeld = [];
let diffrence = Number(localStorage.getItem('diffrence')) || 0;

// Geldsoorten configuratie
const geldSoorten = [
    { waarde: 50, id: 'biljet50' },
    { waarde: 20, id: 'biljet20' },
    { waarde: 10, id: 'biljet10' },
    { waarde: 5, id: 'biljet5' },
    { waarde: 2, id: 'munt2' },
    { waarde: 1, id: 'munt1' },
    { waarde: 0.50, id: 'munt0.50' },
    { waarde: 0.20, id: 'munt0.20' },
    { waarde: 0.10, id: 'munt0.10' },
    { waarde: 0.05, id: 'munt0.05' }
];

// Bereken totaal saldo van wisselgeld
function berekenSaldo() {
    return wisselgeld.reduce((totaal, item) => totaal + item.waarde * item.aantal, 0);
}

// Beperk invoer op basis van diffrence
function checkMaxInput() {
    let huidigTotaal = berekenSaldo();

    geldSoorten.forEach(geld => {
        const input = document.getElementById(geld.id);
        const plus = document.querySelector(`[id="${geld.id}"] + .plus`);
        if (input) {
            let newTotal = huidigTotaal + geld.waarde;
            // Round to 2 decimal places to avoid floating-point issues
            newTotal = Math.round(newTotal * 100) / 100;
            diffrence = Math.round(diffrence * 100) / 100;

            // Add 1 cent tolerance
            if (newTotal > diffrence + 0.01) {
                input.disabled = true;
                if (plus) plus.disabled = true;
            } else {
                input.disabled = false;
                if (plus) plus.disabled = false;
            }
        }
    });
}

// Vul de inputvelden in op basis van wisselgeld
function vulInputVelden() {
    geldSoorten.forEach(geld => {
        const input = document.getElementById(geld.id);
        if (input) {
            let item = wisselgeld.find(i => i.waarde === geld.waarde);
            input.value = item ? item.aantal : 0;
        }
    });
}

// Verzamel invoerwaarden
function verzamelInvoer() {
    return geldSoorten.map(geld => {
        const input = document.getElementById(geld.id);
        return {
            waarde: geld.waarde,
            aantal: input ? parseInt(input.value) || 0 : 0
        };
    });
}

// Update indicatoren
function updateIndicators() {
    geldSoorten.forEach(geld => {
        const indicator = document.getElementById(`${geld.id}-indicator`);
        if (indicator) {
            const item = wisselgeld.find(item => item.waarde === geld.waarde);
            indicator.textContent = item ? item.aantal : 0;
        }
    });
}

// Update wisselgeld selectie in localStorage
function voegToeAanWisselgeld() {
    const invoer = verzamelInvoer();
    let totaal = invoer.reduce((sum, item) => sum + (item.waarde * item.aantal), 0);

    // Round to 2 decimal places to avoid floating-point issues
    totaal = Math.round(totaal * 100) / 100;
    diffrence = Math.round(diffrence * 100) / 100;

    // Add 1 cent tolerance
    if (totaal > diffrence + 0.01) {
        alert(`Je kunt niet meer dan €${diffrence.toFixed(2)} invoeren!`);
        return;
    }

    // Update wisselgeld in localStorage
    wisselgeld = invoer.filter(item => item.aantal > 0);
    localStorage.setItem('wisselgeld', JSON.stringify(wisselgeld));

    toonPortemonnee();
    checkMaxInput();
    updateIndicators();
}

// Event listeners voor knoppen
function setupEventListeners() {
    document.querySelectorAll('.form-item').forEach(item => {
        const input = item.querySelector('input');
        const plus = item.querySelector('.plus');
        const minus = item.querySelector('.minus');

        if (plus && input) {
            plus.addEventListener('click', () => {
                let waarde = parseInt(input.value) || 0;
                let geld = geldSoorten.find(g => g.id === input.id);

                let newTotal = berekenSaldo() + geld.waarde;
                // Round to 2 decimal places to avoid floating-point issues
                newTotal = Math.round(newTotal * 100) / 100;
                diffrence = Math.round(diffrence * 100) / 100;

                // Add 1 cent tolerance
                if (newTotal <= diffrence + 0.01) {
                    input.value = waarde + 1;
                    voegToeAanWisselgeld();
                }
            });
        }

        if (minus && input) {
            minus.addEventListener('click', () => {
                let waarde = parseInt(input.value) || 0;
                if (waarde > 0) {
                    input.value = waarde - 1;
                    voegToeAanWisselgeld();
                }
            });
        }
    });

    const stopWisselgeldBtn = document.getElementById('stopWisselgeldBtn');
    if (stopWisselgeldBtn) {
        stopWisselgeldBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent form submission
            stopWisselgeldInPortemonnee();
        });
    }

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetWisselgeld);
    }
}

// Functie om het wisselgeld definitief naar de portemonnee te sturen en door te geven
function stopWisselgeldInPortemonnee() {
    // Calculate current total
    let totaal = berekenSaldo();
    // Round to 2 decimal places to avoid floating-point issues
    totaal = Math.round(totaal * 100) / 100;
    diffrence = Math.round(diffrence * 100) / 100;

    // Check if total matches the required change amount (with 1 cent tolerance)
    if (Math.abs(totaal - diffrence) > 0.01) {
        alert(`Je moet precies €${diffrence.toFixed(2)} terug krijgen!`);
        return;
    }

    // Store change information in localStorage
    localStorage.setItem('wisselgeldJSON', JSON.stringify(wisselgeld));

    // Clear temporary wisselgeld data
    wisselgeld = [];
    localStorage.removeItem('wisselgeld');

    // Update display
    toonPortemonnee();
    updateIndicators();

    // Redirect to confirm page
    window.location.href = "confirm.html";
}

// Reset de wisselgeld selectie
function resetWisselgeld() {
    wisselgeld = [];
    localStorage.removeItem('wisselgeld');

    // Re-enable all input fields and plus buttons
    geldSoorten.forEach(geld => {
        const input = document.getElementById(geld.id);
        const plus = document.querySelector(`[id="${geld.id}"] + .plus`);
        if (input) {
            input.disabled = false;
            input.value = 0;
        }
        if (plus) {
            plus.disabled = false;
        }
    });

    toonPortemonnee();
    updateIndicators();
}

// Toon portemonnee en saldo
function toonPortemonnee() {
    const lijstElement = document.getElementById('portemonneeLijst');
    if (lijstElement) {
        lijstElement.innerHTML = wisselgeld.map(item =>
            `<li>${item.aantal}x €${item.waarde.toFixed(2)}</li>`
        ).join('');
    }

    const saldoElement = document.getElementById('totaalSaldo');
    if (saldoElement) {
        saldoElement.textContent = berekenSaldo().toFixed(2);
    }

    // Update the change amount display in the h1
    const h1Element = document.querySelector('h1');
    if (h1Element) {
        h1Element.textContent = `Je krijgt nog €${diffrence.toFixed(2)} terug`;
    }

    updateIndicators();
}

// Initialisatie
document.addEventListener('DOMContentLoaded', () => {
    if (diffrence === 0) {
        window.location.href = "index.html";
    }

    setupEventListeners();
    vulInputVelden();
    toonPortemonnee();
    checkMaxInput();
});
