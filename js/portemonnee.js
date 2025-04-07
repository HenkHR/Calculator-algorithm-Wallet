// Laad en bewaar portemonnee gegevens
let portemonnee = JSON.parse(localStorage.getItem('portemonnee')) || [];

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

// Bereken totaal saldo
function berekenSaldo() {
    return portemonnee.reduce((totaal, item) => totaal + item.waarde * item.aantal, 0);
}

// Update alle indicators
function updateIndicators() {
    geldSoorten.forEach(geld => {
        const indicator = document.getElementById(`${geld.id}-indicator`);
        if (indicator) {
            const item = portemonnee.find(item => item.waarde === geld.waarde);
            indicator.textContent = item ? item.aantal : 0;
        }
    });
}

// Toon portemonnee
function toonPortemonnee() {
    const lijstElement = document.getElementById('portemonneeLijst');
    if (lijstElement) {
        lijstElement.innerHTML = portemonnee.map(item =>
            `<li>${item.aantal}x €${item.waarde.toFixed(2)}</li>`
        ).join('');
    }

    const saldo = berekenSaldo().toFixed(2);
    const saldoElement = document.getElementById('totaalSaldo');
    if (saldoElement) {
        saldoElement.textContent = saldo;
        localStorage.setItem('saldo', saldo);
    }
    updateIndicators();
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

// Update portemonnee
function voegToeAanPortemonnee() {
    const invoer = verzamelInvoer();
    portemonnee = invoer.filter(item => item.aantal > 0)
        .sort((a, b) => b.waarde - a.waarde);
    toonPortemonnee();
    localStorage.setItem('portemonnee', JSON.stringify(portemonnee));
}

// Vul input velden
function vulInputVelden() {
    geldSoorten.forEach(geld => {
        const input = document.getElementById(geld.id);
        const indicator = document.getElementById(`${geld.id}-indicator`);
        const item = portemonnee.find(item => item.waarde === geld.waarde);

        if (input) input.value = item ? item.aantal : 0;
        if (indicator) indicator.textContent = item ? item.aantal : 0;
    });
}

// Reset alles
function resetPortemonnee() {
    portemonnee = [];
    const form = document.getElementById('portemonneeForm');
    if (form) form.reset();
    localStorage.removeItem('portemonnee');
    localStorage.removeItem('saldo');
    vulInputVelden();
    toonPortemonnee();
}

// Add these variables at the top of the file
let incrementInterval = null;
const INCREMENT_DELAY = 500; // Delay before starting auto-increment (1 second)
const INCREMENT_SPEED = 100; // Speed of auto-increment in milliseconds

// Add these functions before setupEventListeners
function startAutoIncrement(button, input, increment) {
    // Clear any existing interval
    if (incrementInterval) {
        clearInterval(incrementInterval);
    }

    // Start auto-increment after delay
    let timeoutId = setTimeout(() => {
        // Set wasLongPress when auto-increment starts
        button.dataset.wasLongPress = 'true';
        incrementInterval = setInterval(() => {
            const currentValue = parseInt(input.value) || 0;
            const newValue = currentValue + increment;
            if (newValue >= 0) {
                input.value = newValue;
                voegToeAanPortemonnee();
            }
        }, INCREMENT_SPEED);
    }, INCREMENT_DELAY);

    // Store the timeout ID to clear it if mouseup/touchend happens before delay
    button.dataset.timeoutId = timeoutId;
}

function stopAutoIncrement(button) {
    // Clear the timeout if it exists
    if (button.dataset.timeoutId) {
        clearTimeout(parseInt(button.dataset.timeoutId));
        delete button.dataset.timeoutId;
    }
    // Clear the interval
    if (incrementInterval) {
        clearInterval(incrementInterval);
        incrementInterval = null;
    }
}

function handleIncrement(button, input, increment) {
    if (button.dataset.wasLongPress !== 'true') {
        const currentValue = parseInt(input.value) || 0;
        const newValue = currentValue + increment;
        if (newValue >= 0) {
            input.value = newValue;
            voegToeAanPortemonnee();
        }
    }
}

// Modify the setupEventListeners function
function setupEventListeners() {
    document.querySelectorAll('.form-item').forEach(item => {
        const input = item.querySelector('input');
        const plus = item.querySelector('.plus');
        const minus = item.querySelector('.minus');

        if (plus && input) {
            // Mouse events for desktop
            plus.addEventListener('mousedown', (e) => {
                e.preventDefault();
                plus.dataset.wasLongPress = 'false';
                plus.dataset.pressStartTime = Date.now();
                startAutoIncrement(plus, input, 1);
            });

            plus.addEventListener('mouseup', (e) => {
                e.preventDefault();
                stopAutoIncrement(plus);
                handleIncrement(plus, input, 1);
            });

            plus.addEventListener('mouseleave', (e) => {
                e.preventDefault();
                stopAutoIncrement(plus);
            });

            // Touch events for mobile
            plus.addEventListener('touchstart', (e) => {
                e.preventDefault();
                plus.dataset.wasLongPress = 'false';
                plus.dataset.pressStartTime = Date.now();
                startAutoIncrement(plus, input, 1);
            });

            plus.addEventListener('touchend', (e) => {
                e.preventDefault();
                stopAutoIncrement(plus);
                handleIncrement(plus, input, 1);
            });

            plus.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                stopAutoIncrement(plus);
            });
        }

        if (minus && input) {
            // Mouse events for desktop
            minus.addEventListener('mousedown', (e) => {
                e.preventDefault();
                minus.dataset.wasLongPress = 'false';
                minus.dataset.pressStartTime = Date.now();
                startAutoIncrement(minus, input, -1);
            });

            minus.addEventListener('mouseup', (e) => {
                e.preventDefault();
                stopAutoIncrement(minus);
                handleIncrement(minus, input, -1);
            });

            minus.addEventListener('mouseleave', (e) => {
                e.preventDefault();
                stopAutoIncrement(minus);
            });

            // Touch events for mobile
            minus.addEventListener('touchstart', (e) => {
                e.preventDefault();
                minus.dataset.wasLongPress = 'false';
                minus.dataset.pressStartTime = Date.now();
                startAutoIncrement(minus, input, -1);
            });

            minus.addEventListener('touchend', (e) => {
                e.preventDefault();
                stopAutoIncrement(minus);
                handleIncrement(minus, input, -1);
            });

            minus.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                stopAutoIncrement(minus);
            });
        }
    });

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetPortemonnee);
    }
}

function openModal() {
    modalOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
}

// Function to close modal
function closeModal() {
    modalOverlay.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Initialisatie
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    vulInputVelden();
    toonPortemonnee();

    const modalOverlay = document.getElementById('modalOverlay');
    const openModalBtn = document.querySelector('.open-modal-btn');
    const closeBtn = document.getElementById('closeBtn');
    openModalBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.style.display === 'block') {
            closeModal();
        }
    });
});