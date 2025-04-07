// Constants for available denominations in cents (to avoid floating-point issues)
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

// Function to save wallet contents to localStorage
function saveWalletToStorage() {
    const wallet = getWalletContents();
    localStorage.setItem('walletContents', JSON.stringify(wallet));
}

// Function to load wallet contents from localStorage
function loadWalletFromStorage() {
    const savedWallet = localStorage.getItem('walletContents');
    if (savedWallet) {
        const wallet = JSON.parse(savedWallet);
        // Update all input fields with saved values
        for (let [denomination, count] of Object.entries(wallet)) {
            const input = document.getElementById(denomination);
            if (input) {
                input.value = count;
            }
        }
        // Update the total after loading
        updateWalletTotal();
    }
}

// Function to get current wallet contents
function getWalletContents() {
    let wallet = {};
    for (let denomination of Object.keys(DENOMINATIONS)) {
        wallet[denomination] = parseInt(document.getElementById(denomination).value) || 0;
    }
    return wallet;
}

// Function to calculate wallet total
function calculateWalletTotal() {
    let total = 0;
    const wallet = getWalletContents();

    for (let [denomination, count] of Object.entries(wallet)) {
        total += (DENOMINATIONS[denomination] * count);
    }

    return total / 100; // Convert back to euros
}

// Function to calculate total amount for a payment combination
function calculatePaymentTotal(payment) {
    let total = 0;
    for (let [denomination, count] of Object.entries(payment)) {
        total += DENOMINATIONS[denomination] * count;
    }
    return total / 100; // Convert back to euros
}

// Function to calculate optimal payment from wallet
function calculateOptimalPaymentFromWallet(targetAmount) {
    let targetCents = Math.round(targetAmount * 100);
    let wallet = getWalletContents();
    let result = {};
    let possiblePayment = null;

    // Initialize result with zeros
    for (let key of Object.keys(DENOMINATIONS)) {
        result[key] = 0;
    }

    // First try to find exact payment
    let exactPayment = findExactPayment(targetCents, wallet);
    if (exactPayment) {
        return {
            payment: exactPayment,
            totalPaid: targetAmount,
            change: 0
        };
    }

    // If exact payment not possible, find the smallest possible overpayment
    possiblePayment = findSmallestOverpayment(targetCents, wallet);

    if (!possiblePayment) {
        return {
            payment: null,
            totalPaid: 0,
            change: 0,
            error: "Cannot make this payment with available money"
        };
    }

    let totalPaid = calculatePaymentTotal(possiblePayment);
    return {
        payment: possiblePayment,
        totalPaid: totalPaid,
        change: totalPaid - targetAmount
    };
}

// Helper function to find exact payment
function findExactPayment(targetCents, wallet) {
    let result = {};
    let remainingCents = targetCents;
    let denominations = Object.entries(DENOMINATIONS).sort((a, b) => b[1] - a[1]); // Sort by value descending

    // Initialize result
    for (let key of Object.keys(DENOMINATIONS)) {
        result[key] = 0;
    }

    // Try to make exact payment with available money
    for (let [denomination, value] of denominations) {
        let availableCount = wallet[denomination];
        if (availableCount > 0 && remainingCents >= value) {
            let neededCount = Math.min(
                Math.floor(remainingCents / value),
                availableCount
            );
            if (neededCount > 0) {
                result[denomination] = neededCount;
                remainingCents -= neededCount * value;
            }
        }
    }

    // If we still have remaining cents, try to make up the difference with smaller denominations
    if (remainingCents > 0) {
        denominations = Object.entries(DENOMINATIONS)
            .filter(([_, value]) => value <= remainingCents)
            .sort((a, b) => b[1] - a[1]);

        for (let [denomination, value] of denominations) {
            let availableCount = wallet[denomination];
            if (availableCount > 0 && remainingCents >= value) {
                let neededCount = Math.min(
                    Math.floor(remainingCents / value),
                    availableCount
                );
                if (neededCount > 0) {
                    result[denomination] = neededCount;
                    remainingCents -= neededCount * value;
                }
            }
        }
    }

    // Return null if exact payment not possible
    return remainingCents === 0 ? result : null;
}

// Helper function to find smallest possible overpayment
function findSmallestOverpayment(targetCents, wallet) {
    let result = {};
    let currentAmount = 0;
    let walletCopy = { ...wallet };
    let bestResult = null;
    let smallestOverpayment = Infinity;

    // Initialize result
    for (let key of Object.keys(DENOMINATIONS)) {
        result[key] = 0;
    }

    // Try different combinations starting with each denomination
    for (let [startDenom, startValue] of Object.entries(DENOMINATIONS)) {
        let tempResult = { ...result };
        let tempAmount = 0;
        let tempWallet = { ...walletCopy };

        // Try using the starting denomination
        if (tempWallet[startDenom] > 0) {
            tempResult[startDenom]++;
            tempWallet[startDenom]--;
            tempAmount += startValue;
        }

        // If we haven't reached the target, try to make up the difference
        if (tempAmount < targetCents) {
            let remainingCents = targetCents - tempAmount;
            let denominations = Object.entries(DENOMINATIONS)
                .filter(([denom, value]) => tempWallet[denom] > 0 && value <= remainingCents)
                .sort((a, b) => b[1] - a[1]);

            for (let [denomination, value] of denominations) {
                while (tempWallet[denomination] > 0 && tempAmount < targetCents) {
                    tempResult[denomination]++;
                    tempWallet[denomination]--;
                    tempAmount += value;
                }
            }
        }

        // If we found a valid combination, check if it's the best so far
        if (tempAmount >= targetCents) {
            let overpayment = tempAmount - targetCents;
            if (overpayment < smallestOverpayment) {
                smallestOverpayment = overpayment;
                bestResult = { ...tempResult };
            }
        }
    }

    return bestResult;
}

// Function to format money amount
function formatMoney(amount) {
    return '€' + amount.toFixed(2);
}

// Function to calculate and display optimal payment
function calculatePayment() {
    const amountInput = document.getElementById('amountToCalculate').value;
    const amount = parseFloat(amountInput);

    if (isNaN(amount) || amount <= 0) {
        document.getElementById('optimalResult').innerHTML =
            '<p class="error">Please enter a valid amount</p>';
        return;
    }

    const walletTotal = calculateWalletTotal();
    if (walletTotal < amount) {
        document.getElementById('optimalResult').innerHTML =
            `<p class="error">You don't have enough money in your wallet. ` +
            `Total in wallet: ${formatMoney(walletTotal)}</p>`;
        return;
    }

    const result = calculateOptimalPaymentFromWallet(amount);

    if (result.error) {
        document.getElementById('optimalResult').innerHTML =
            `<p class="error">${result.error}</p>`;
        return;
    }

    let resultHTML = `<h3>Payment calculation for ${formatMoney(amount)}:</h3>`;

    // Show payment breakdown
    resultHTML += '<div class="payment-breakdown"><h4>Use these from your wallet:</h4><ul>';

    for (let [denomination, count] of Object.entries(result.payment)) {
        if (count > 0) {
            let value = DENOMINATIONS[denomination] / 100;
            let label = value >= 5 ? `€${value} bill` :
                value >= 1 ? `€${value} coin` :
                    `${value * 100}c coin`;
            resultHTML += `<li>${count} × ${label}${count > 1 ? 's' : ''}</li>`;
        }
    }

    resultHTML += '</ul></div>';

    // Show total paid and change information
    if (result.change > 0) {
        resultHTML += `<div class="payment-info">
            <p>Total to pay: ${formatMoney(amount)}</p>
            <p>You'll pay: ${formatMoney(result.totalPaid)}</p>
            <div class="change-info">
                <h4>You'll get back:</h4>
                <p class="change">${formatMoney(result.change)} in change</p>
            </div>
        </div>`;
    } else {
        resultHTML += `<p class="perfect-match">Exact amount! No change needed.</p>`;
    }

    document.getElementById('optimalResult').innerHTML = resultHTML;
}

// Function to update wallet total display and save to localStorage
function updateWalletTotal() {
    const total = calculateWalletTotal();
    document.getElementById('walletTotal').textContent = formatMoney(total);
    saveWalletToStorage(); // Save whenever the wallet is updated
}

// Add event listener for when the page loads
document.addEventListener('DOMContentLoaded', function () {
    loadWalletFromStorage();

    // Add event listener for clear wallet button
    document.querySelector('.clear-wallet').addEventListener('click', clearWallet);
});

// Add this new function to clear the wallet
function clearWallet() {
    if (confirm('Are you sure you want to clear your wallet?')) {
        // Clear localStorage
        localStorage.removeItem('walletContents');

        // Reset all input fields to 0
        for (let denomination of Object.keys(DENOMINATIONS)) {
            const input = document.getElementById(denomination);
            if (input) {
                input.value = 0;
            }
        }

        // Update the total display
        updateWalletTotal();
    }
} 