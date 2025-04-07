window.addEventListener("load", init)

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

let portemonnee = JSON.parse(localStorage.getItem('portemonnee')) || []
let totalSaldo = Number(localStorage.getItem("saldo"))
let price = Number(localStorage.getItem("price"))
let section;

function init() {
    let backButton = document.querySelector("#backbutton")
    backButton.addEventListener("click", backButtonHandler)
    section = document.querySelector("#my-money")
    let button = document.querySelector("#button")
    button.addEventListener("click", buttonHandler)

    // Initialize the calculator with the current price
    if (price > 0) {
        calculateOptimalPayment(price);
    }
}

function buttonHandler(e) {
    e.preventDefault(); // Prevent default button behavior
    moneyBack();
}

function backButtonHandler(e) {
    localStorage.removeItem("wisselgeld")
    localStorage.removeItem("diffrence")
    localStorage.removeItem("wisselgeldJSON")
}

// Function to get current wallet contents
function getWalletContents() {
    let wallet = {};

    // Initialize wallet with zeros for all denominations
    for (let [denomination, value] of Object.entries(DENOMINATIONS)) {
        wallet[denomination] = 0;
    }

    // Count the number of each denomination in the wallet
    portemonnee.forEach(item => {
        for (let [denomination, value] of Object.entries(DENOMINATIONS)) {
            if (item.waarde === value / 100) {
                wallet[denomination] += item.aantal; // Add the aantal instead of just incrementing by 1
            }
        }
    });

    // Debug log to check wallet contents
    console.log("Wallet contents:", wallet);
    console.log("Portemonnee:", portemonnee);
    console.log("Total wallet value:", calculateWalletTotal());

    return wallet;
}

// Function to calculate wallet total
function calculateWalletTotal() {
    let total = 0;
    for (let item of portemonnee) {
        total += item.waarde * item.aantal;
    }
    return total;
}

// Function to calculate total amount for a payment combination
function calculatePaymentTotal(payment) {
    let total = 0;
    for (let [denomination, count] of Object.entries(payment)) {
        total += DENOMINATIONS[denomination] * count;
    }
    return total / 100; // Convert back to euros
}

// New function to find exact payment using all available denominations
function findExactPaymentWithAllDenominations(targetCents, wallet) {
    let result = {};
    let remainingCents = targetCents;
    let denominations = Object.entries(DENOMINATIONS)
        .filter(([denom, value]) => wallet[denom] > 0)
        .sort((a, b) => b[1] - a[1]); // Sort by value descending

    // Initialize result
    for (let key of Object.keys(DENOMINATIONS)) {
        result[key] = 0;
    }

    // Try to make exact payment with available money
    for (let [denomination, value] of denominations) {
        let availableCount = wallet[denomination];
        if (availableCount > 0) {
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

    // Debug log to check the result
    console.log("Target cents:", targetCents);
    console.log("Remaining cents:", remainingCents);
    console.log("Result:", result);
    console.log("Wallet:", wallet);

    // If we still have remaining cents, try to make up the difference with any available coins
    if (remainingCents > 0) {
        // Try all available denominations that could help make up the difference
        denominations = Object.entries(DENOMINATIONS)
            .filter(([denom, value]) => wallet[denom] > 0)
            .sort((a, b) => b[1] - a[1]);

        for (let [denomination, value] of denominations) {
            let availableCount = wallet[denomination];
            if (availableCount > 0) {
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

    // Calculate total paid amount
    let totalPaid = 0;
    for (let [denomination, count] of Object.entries(result)) {
        totalPaid += DENOMINATIONS[denomination] * count;
    }

    // Return null if exact payment not possible
    return totalPaid === targetCents ? result : null;
}

// New function to find payment using combinations of denominations
function findPaymentWithCombinations(targetCents, wallet) {
    let result = {};
    let remainingCents = targetCents;
    let denominations = Object.entries(DENOMINATIONS)
        .filter(([denom, value]) => wallet[denom] > 0)
        .sort((a, b) => b[1] - a[1]); // Sort by value descending

    // Initialize result
    for (let key of Object.keys(DENOMINATIONS)) {
        result[key] = 0;
    }

    // Try to make payment with available money
    for (let [denomination, value] of denominations) {
        let availableCount = wallet[denomination];
        if (availableCount > 0) {
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

    // If we still have remaining cents, try to make up the difference with any available coins
    if (remainingCents > 0) {
        // Try all available denominations that could help make up the difference
        denominations = Object.entries(DENOMINATIONS)
            .filter(([denom, value]) => wallet[denom] > 0)
            .sort((a, b) => b[1] - a[1]);

        for (let [denomination, value] of denominations) {
            let availableCount = wallet[denomination];
            if (availableCount > 0) {
                let neededCount = Math.min(
                    Math.ceil(remainingCents / value),
                    availableCount
                );
                if (neededCount > 0) {
                    result[denomination] = neededCount;
                    remainingCents -= neededCount * value;
                }
            }
        }
    }

    // Calculate total paid amount
    let totalPaid = 0;
    for (let [denomination, count] of Object.entries(result)) {
        totalPaid += DENOMINATIONS[denomination] * count;
    }

    // Return the result if we have a valid payment
    return totalPaid >= targetCents ? result : null;
}

// New function to find best single denomination payment
function findBestSingleDenominationPayment(targetCents, wallet) {
    let result = {};
    let bestResult = null;
    let smallestOverpayment = Infinity;

    // Initialize result
    for (let key of Object.keys(DENOMINATIONS)) {
        result[key] = 0;
    }

    // Try each denomination that can cover the payment
    for (let [denom, value] of Object.entries(DENOMINATIONS)) {
        if (wallet[denom] > 0 && value >= targetCents) {
            let tempResult = { ...result };
            tempResult[denom] = 1;
            let overpayment = value - targetCents;
            if (overpayment < smallestOverpayment) {
                smallestOverpayment = overpayment;
                bestResult = tempResult;
            }
        }
    }

    return bestResult;
}

// Function to calculate optimal payment from wallet
function calculateOptimalPaymentFromWallet(targetAmount) {
    let targetCents = Math.round(targetAmount * 100);
    let wallet = getWalletContents();
    let result = {};

    // Debug log for payment calculation
    console.log("Target amount:", targetAmount);
    console.log("Target cents:", targetCents);
    console.log("Available wallet:", wallet);

    // Initialize result with zeros
    for (let key of Object.keys(DENOMINATIONS)) {
        result[key] = 0;
    }

    // First, try to find the best single denomination payment
    let singleDenominationPayment = findBestSingleDenominationPayment(targetCents, wallet);
    if (singleDenominationPayment) {
        let totalPaid = calculatePaymentTotal(singleDenominationPayment);
        console.log("Found single denomination payment:", singleDenominationPayment);
        console.log("Total paid:", totalPaid);
        return {
            payment: singleDenominationPayment,
            totalPaid: totalPaid,
            change: totalPaid - targetAmount
        };
    }

    // Then try to find exact payment using all denominations
    let exactPayment = findExactPaymentWithAllDenominations(targetCents, wallet);
    if (exactPayment) {
        let totalPaid = calculatePaymentTotal(exactPayment);
        console.log("Found exact payment:", exactPayment);
        console.log("Total paid:", totalPaid);
        return {
            payment: exactPayment,
            totalPaid: totalPaid,
            change: 0
        };
    }

    // Try the new combination function
    let combinationPayment = findPaymentWithCombinations(targetCents, wallet);
    if (combinationPayment) {
        let totalPaid = calculatePaymentTotal(combinationPayment);
        console.log("Found combination payment:", combinationPayment);
        console.log("Total paid:", totalPaid);
        return {
            payment: combinationPayment,
            totalPaid: totalPaid,
            change: totalPaid - targetAmount
        };
    }

    // Then try to find the smallest denomination that can cover the payment
    let smallestValidDenomination = Object.entries(DENOMINATIONS)
        .filter(([denom, value]) => wallet[denom] > 0 && value >= targetCents)
        .sort((a, b) => a[1] - b[1])[0];

    if (smallestValidDenomination) {
        let [denom, value] = smallestValidDenomination;
        let tempResult = { ...result };
        tempResult[denom] = 1;
        let totalPaid = value / 100;
        console.log("Using single denomination:", tempResult);
        console.log("Total paid:", totalPaid);
        return {
            payment: tempResult,
            totalPaid: totalPaid,
            change: totalPaid - targetAmount
        };
    }

    // If no exact payment possible, try combinations
    let possiblePayment = findSmallestOverpayment(targetCents, wallet);

    if (!possiblePayment) {
        console.log("No valid payment combination found");
        return {
            payment: null,
            totalPaid: 0,
            change: 0,
            error: "Cannot make this payment with available money"
        };
    }

    let totalPaid = calculatePaymentTotal(possiblePayment);
    console.log("Found possible payment:", possiblePayment);
    console.log("Total paid:", totalPaid);
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
        if (availableCount > 0) {
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

    // Debug log to check the result
    console.log("Target cents:", targetCents);
    console.log("Remaining cents:", remainingCents);
    console.log("Result:", result);
    console.log("Wallet:", wallet);

    // If we still have remaining cents, try to make up the difference with any available coins
    if (remainingCents > 0) {
        // Try all available denominations that could help make up the difference
        denominations = Object.entries(DENOMINATIONS)
            .filter(([denom, value]) => wallet[denom] > 0)
            .sort((a, b) => b[1] - a[1]);

        for (let [denomination, value] of denominations) {
            let availableCount = wallet[denomination];
            if (availableCount > 0) {
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

    // If we still have remaining cents, try to use any available coins to minimize the difference
    if (remainingCents > 0) {
        // Try using any remaining coins to get as close as possible
        denominations = Object.entries(DENOMINATIONS)
            .filter(([denom, value]) => wallet[denom] > 0)
            .sort((a, b) => b[1] - a[1]);

        for (let [denomination, value] of denominations) {
            let availableCount = wallet[denomination];
            if (availableCount > 0) {
                let neededCount = Math.min(
                    Math.ceil(remainingCents / value),
                    availableCount
                );
                if (neededCount > 0) {
                    result[denomination] = neededCount;
                    remainingCents -= neededCount * value;
                }
            }
        }
    }

    // Calculate total paid amount
    let totalPaid = 0;
    for (let [denomination, count] of Object.entries(result)) {
        totalPaid += DENOMINATIONS[denomination] * count;
    }

    // Return null if exact payment not possible
    return totalPaid === targetCents ? result : null;
}

// Helper function to find smallest possible overpayment
function findSmallestOverpayment(targetCents, wallet) {
    let result = {};
    let bestResult = null;
    let smallestOverpayment = Infinity;

    // Initialize result
    for (let key of Object.keys(DENOMINATIONS)) {
        result[key] = 0;
    }

    // First, try to find a single denomination that can cover the payment
    let smallestValidDenomination = Object.entries(DENOMINATIONS)
        .filter(([denom, value]) => wallet[denom] > 0 && value >= targetCents)
        .sort((a, b) => a[1] - b[1])[0];

    if (smallestValidDenomination) {
        let [denom, value] = smallestValidDenomination;
        bestResult = { ...result };
        bestResult[denom] = 1;
        return bestResult;
    }

    // If no single denomination can cover the payment, try combinations
    let denominations = Object.entries(DENOMINATIONS)
        .filter(([denom, value]) => wallet[denom] > 0)
        .sort((a, b) => b[1] - a[1]); // Sort by value descending

    // Try each denomination as a starting point
    for (let [startDenom, startValue] of denominations) {
        let tempResult = { ...result };
        let tempAmount = 0;
        let tempWallet = { ...wallet };

        // Use as many of the starting denomination as possible
        while (tempWallet[startDenom] > 0 && tempAmount < targetCents) {
            tempResult[startDenom]++;
            tempWallet[startDenom]--;
            tempAmount += startValue;
        }

        // If we still need more money, try to add other denominations
        if (tempAmount < targetCents) {
            for (let [denom, value] of denominations) {
                if (denom !== startDenom && tempWallet[denom] > 0) {
                    while (tempWallet[denom] > 0 && tempAmount < targetCents) {
                        tempResult[denom]++;
                        tempWallet[denom]--;
                        tempAmount += value;
                    }
                }
            }
        }

        // If we have enough money, check if this is the best result so far
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

// Add this function after the formatMoney function
function roundToNearest5Cents(amount) {
    // Convert to cents, round to nearest 5, then convert back to euros
    return (Math.round(amount * 100 / 5) * 5 / 100).toFixed(2);
}

// Function to calculate and display optimal payment
function calculateOptimalPayment(amount) {
    if (isNaN(amount) || amount <= 0) {
        section.innerHTML = '<p class="error">Please enter a valid amount</p>';
        return;
    }

    const walletTotal = calculateWalletTotal();
    if (walletTotal < amount) {
        section.innerHTML = `<p class="error">You don't have enough money in your wallet. ` +
            `Total in wallet: ${formatMoney(walletTotal)}</p>`;
        return;
    }

    const result = calculateOptimalPaymentFromWallet(amount);

    if (result.error) {
        section.innerHTML = `<p class="error">${result.error}</p>`;
        return;
    }

    // Clear the section
    section.innerHTML = '';

    // Display the payment breakdown
    for (let [denomination, count] of Object.entries(result.payment)) {
        if (count > 0) {
            let value = DENOMINATIONS[denomination] / 100;
            // Create a container for this denomination
            let denominationContainer = document.createElement("div");
            denominationContainer.classList.add("denomination-container");
            section.append(denominationContainer);

            // Create the specified number of coin/bill elements
            for (let i = 0; i < count; i++) {
                let div = document.createElement("div");
                denominationContainer.append(div);
                div.dataset.name = value;

                let image;
                if (value >= 1) {
                    image = `./img/${value}.png`;
                } else if (value < 1) {
                    image = `./img/${value.toFixed(2)}.png`;
                } else {
                    console.log("img error");
                }

                if (value > 2) {
                    div.classList.add("paper");
                } else if (value <= 2) {
                    div.classList.add("coin");
                }

                let img = document.createElement("img");
                img.src = image;
                div.append(img);

                let p = document.createElement("h3");
                p.classList.add("calcP");
                p.innerText = `€${value.toFixed(2)}`;
                div.append(p);
            }
        }
    }

    // Store the change amount for later use
    if (result.change > 0) {
        localStorage.setItem("wisselgeld", result.change.toFixed(2));
        localStorage.setItem("diffrence", result.change.toFixed(2));
    }
}

function moneyBack() {
    // Get the optimal payment result
    const result = calculateOptimalPaymentFromWallet(price);

    if (result.payment) {
        // Create array of used money items
        let usedMoneyItems = [];
        for (let [denomination, count] of Object.entries(result.payment)) {
            if (count > 0) {
                const value = DENOMINATIONS[denomination] / 100;
                for (let i = 0; i < count; i++) {
                    usedMoneyItems.push({ waarde: value });
                }
            }
        }

        // Store payment information in localStorage
        const paymentInfo = {
            payment: result.payment,
            totalPaid: price,
            change: result.change,
            usedMoney: usedMoneyItems // Store the actual money items used
        };
        localStorage.setItem('paymentInfo', JSON.stringify(paymentInfo));

        // Store change information with rounding to nearest 5 cents
        if (result.change > 0) {
            const roundedChange = roundToNearest5Cents(result.change);
            localStorage.setItem("wisselgeld", roundedChange);
            localStorage.setItem("diffrence", roundedChange);
            window.location.href = "wisselgeld.html";
        } else {
            localStorage.setItem("wisselgeld", "0");
            localStorage.setItem("diffrence", "0");
            window.location.href = "confirm.html";
        }
    }
}

