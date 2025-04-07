window.addEventListener("load", init)

let sortDirection = 'desc'; // Default sort direction
let currentSortColumn = 'date'; // Track which column is being sorted

function init() {
    loadProducts()
    window.filterProducts = filterProducts;

    // Add click event listeners to both date and price headers
    const dateHeader = document.querySelector('th:nth-child(3)');
    const priceHeader = document.querySelector('th:nth-child(2)');

    dateHeader.addEventListener('click', () => sortByColumn('date'));
    priceHeader.addEventListener('click', () => sortByColumn('price'));
}

//haalt alles op uit de localstorage en zet het in de tabel
function loadProducts() {
    const tableBody = document.getElementById("productTableBody");
    tableBody.innerHTML = "";
    const storedProducts = JSON.parse(localStorage.getItem("products")) || [];

    storedProducts.forEach(product => {
        const row = document.createElement("tr");
        row.innerHTML = `
                    <td>${product.name}</td>
                    <td>€${Number(product.price).toFixed(2)}</td>
                    <td>${product.date}</td>
                `;
        tableBody.appendChild(row);
    });
}

//function wordt elke keer als er een letter word getypt uitgevoerd.
//verbergt rows die niet aan de search query voldoen.
function filterProducts() {
    const searchInput = document.getElementById("searchInput").value.toLowerCase();
    const tableBody = document.getElementById("productTableBody");
    const tableRows = tableBody.getElementsByTagName("tr");

    Array.from(tableRows).forEach(row => {
        const name = row.children[0].textContent.toLowerCase();
        const price = row.children[1].textContent.toLowerCase();
        const date = row.children[2].textContent.toLowerCase();

        if (name.includes(searchInput) || price.includes(searchInput) || date.includes(searchInput)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

function sortByColumn(column) {
    const tableBody = document.getElementById("productTableBody");
    const rows = Array.from(tableBody.getElementsByTagName("tr"));

    // If clicking a different column, reset sort direction
    if (currentSortColumn !== column) {
        sortDirection = 'desc';
    }

    // Sort the rows based on the selected column
    rows.sort((a, b) => {
        let valueA, valueB;

        if (column === 'date') {
            valueA = new Date(a.children[2].textContent);
            valueB = new Date(b.children[2].textContent);
        } else if (column === 'price') {
            valueA = parseFloat(a.children[1].textContent.replace('€', ''));
            valueB = parseFloat(b.children[1].textContent.replace('€', ''));
        }

        if (sortDirection === 'asc') {
            return valueA - valueB;
        } else {
            return valueB - valueA;
        }
    });

    // Clear the table body
    tableBody.innerHTML = '';

    // Add sorted rows back to the table
    rows.forEach(row => {
        tableBody.appendChild(row);
    });

    // Toggle sort direction
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';

    // Update header text to show sort direction
    const dateHeader = document.querySelector('th:nth-child(3)');
    const priceHeader = document.querySelector('th:nth-child(2)');

    // Reset both headers
    dateHeader.textContent = 'Datum';
    priceHeader.textContent = 'Prijs';

    // Update the clicked header
    if (column === 'date') {
        dateHeader.textContent = `Datum ${sortDirection === 'asc' ? '↑' : '↓'}`;
    } else {
        priceHeader.textContent = `Prijs ${sortDirection === 'asc' ? '↑' : '↓'}`;
    }

    // Update current sort column
    currentSortColumn = column;
}
