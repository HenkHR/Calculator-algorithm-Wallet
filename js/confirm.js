window.addEventListener("load", init)

// Define denominations for money values
const DENOMINATIONS = {
    bill50: 5000,
    bill20: 2000,
    bill10: 1000,
    bill5: 500,
    coin2: 200,
    coin1: 100,
    coin50c: 50,
    coin20c: 20,
    coin10c: 10,
    coin5c: 5
};

let wisselGeld = JSON.parse(localStorage.getItem('wisselgeldJSON'));
let product = localStorage.getItem('product') || " ";
let myMoney = []
let section
let date = localStorage.getItem("date-time")
let price = localStorage.getItem("price")

function init() {
    const backButton = document.querySelector("#button")
    backButton.addEventListener("click", backButtonHandler)
    section = document.querySelector("#cash-back")
    button = document.querySelector("#button")
    button.addEventListener("click", goBackToMain)
    console.log(wisselGeld)
    loopMoney()
    triggerConfetti()

    // Update the message last
    let cashBackElement = document.querySelector('.cash-back');
    if (cashBackElement) {
        let diffrence = Number(localStorage.getItem('diffrence')) || 0;
        if (diffrence > 0) {
            cashBackElement.textContent = `Je krijgt €${diffrence.toFixed(2)} terug`;
        } else {
            cashBackElement.textContent = "Je betaling is gelukt, je krijgt geen wisselgeld terug.";
        }
    }
}

function loopMoney() {
    if (!wisselGeld) {
        wisselGeld = [];
    }
    wisselGeld.forEach(money => {
        myMoney.push(money)
    })
}

function goBackToMain() {
    // Update wallet with payment and change
    let wisselgeldJSON = JSON.parse(localStorage.getItem('wisselgeldJSON')) || [];
    let diffrence = Number(localStorage.getItem('diffrence')) || 0;
    let paymentInfo = JSON.parse(localStorage.getItem('paymentInfo')) || {};

    // Get current wallet data
    let portemonnee = JSON.parse(localStorage.getItem('portemonnee')) || [];
    let totalSaldo = Number(localStorage.getItem('saldo')) || 0;

    // Always update wallet with payment and change
    if (paymentInfo.usedMoney && paymentInfo.usedMoney.length > 0) {
        // Remove used money from wallet
        paymentInfo.usedMoney.forEach(item => {
            const index = portemonnee.findIndex(walletItem => walletItem.waarde === item.waarde);
            if (index !== -1) {
                portemonnee.splice(index, 1);
            }
        });

        // Add change to wallet if any
        if (wisselgeldJSON && wisselgeldJSON.length > 0) {
            wisselgeldJSON.forEach(item => {
                portemonnee.push(item);
            });
        }

        // Update total balance
        totalSaldo = totalSaldo - paymentInfo.totalPaid + diffrence;

        // Update localStorage
        localStorage.setItem("saldo", totalSaldo.toFixed(2));
        localStorage.setItem("portemonnee", JSON.stringify(portemonnee));
    }

    // Create payment object with current date and time
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const dateTime = `${day}-${month}-${year} ${hours}:${minutes}`;

    // Get existing products or create empty array
    let products = JSON.parse(localStorage.getItem('products')) || [];

    // Create new payment object with placeholder for empty product name
    const newPayment = {
        name: product.trim() === "" ? "Niet opgegeven" : product,
        price: price,
        date: dateTime
    };

    // Add new payment to products array
    products.push(newPayment);

    // Store updated products array
    localStorage.setItem('products', JSON.stringify(products));

    // Clear temporary data
    localStorage.removeItem("product");
    localStorage.removeItem("diffrence");
    localStorage.removeItem("wisselgeldJSON");
    localStorage.removeItem("price");
    localStorage.removeItem("paymentInfo");

    // Redirect to main page
    window.location.href = "index.html";
}

function backButtonHandler(e) {
    e.preventDefault()
    window.location.href = "./index.html"
}

function triggerConfetti() {
    // Fire multiple confetti bursts
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Fire confetti from multiple angles
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
    }, 250);
}