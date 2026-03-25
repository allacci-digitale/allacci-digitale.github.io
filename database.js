// database.js - Shared search logic for database.html and database-en.html

const jsonUrl = "https://allacci-digitale.github.io/data/database.json";

// Detect language from the <html lang="..."> attribute
const pageLanguage = (document.documentElement.lang === "it") ? "Italian" : "English";

// ========== City Name Normalization ==========
let cityMap = {};

async function loadCityMap() {
    try {
        const response = await fetch("correspondences.json");
        cityMap = await response.json();
    } catch (error) {
        console.error("Error loading city correspondences:", error);
    }
}

function normalizeCityName(inputName) {
    const formatted = inputName.charAt(0).toUpperCase() + inputName.slice(1).toLowerCase();
    return cityMap[formatted] || inputName;
}

function normalizeCityField(field, value) {
    const relevantFields = [
        "luogo di pubblicazione/city",
        "luogo di rappresentazione/location"
    ];
    return relevantFields.includes(field) ? normalizeCityName(value) : value;
}

// ========== Utility: Strip HTML anchor tags ==========
function stripHtml(html) {
    if (!html) return "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

// ========== Utility: Escape special regex characters ==========
function escapeRegex(str) {
    // Preserve * and . as wildcards (match any character), escape everything else
    return str.replace(/[+?^${}()|[\]\\]/g, '\\$&')
              .replace(/\*/g, '.*')
              .replace(/\./g, '.');
}

// ========== Utility: Map UI Field Labels to JSON Keys ==========
function mapFieldName(uiLabel) {
    const mapping = {
        "Luogo di prima pubblicazione": "luogo di pubblicazione/city",
        "Luogo di prima rappresentazione": "luogo di rappresentazione/location",
        "Place of publication": "luogo di pubblicazione/city",
        "Performance venue": "luogo di rappresentazione/location",
        "Voce": "voce/entry",
        "Titolo": "titolo/title",
        "Sottotitolo": "sottotitolo/subtitle",
        "Autore": "autore/author",
        "Genere": "genere/genre",
        "Metro": "metro/mode",
        "Editore": "editore/publisher",
        "Anno": "anno/year",
        "Formato": "formato/format",
        "Compositore": "compositore/composer",
        "Traduzione?": "traduzione/translation",
        "Libretto?": "libretto",
        "Entry": "voce/entry",
        "Title": "titolo/title",
        "Subtitle": "sottotitolo/subtitle",
        "Author": "autore/author",
        "Genre": "genere/genre",
        "Mode": "metro/mode",
        "Publisher": "editore/publisher",
        "Year": "anno/year",
        "Format": "formato/format",
        "Composer": "compositore/composer",
        "Translation?": "traduzione/translation"
    };
    return mapping[uiLabel] || uiLabel;
}

// ========== Table Header Creation ==========
function createTableHeader(language) {
    const table = document.createElement("table");
    table.classList.add("sticky-table");

    const headerRow = table.createTHead().insertRow();

    const columnNames = {
        "Italian": ["Voce", "Titolo", "Sottotitolo", "Autore", "Genere", "Metro", "Luogo di prima pubblicazione", "Luogo di prima rappresentazione", "Editore", "Anno", "Formato", "Libretto?", "Compositore", "Traduzione?"],
        "English": ["Entry", "Title", "Subtitle", "Author", "Genre", "Mode", "Place of publication", "Performance venue", "Publisher", "Year", "Format", "Libretto?", "Composer", "Translation?"]
    };

    columnNames[language].forEach(columnName => {
        const headerCell = document.createElement("th");
        headerCell.textContent = columnName;
        headerRow.appendChild(headerCell);
    });

    return table;
}

// ========== Main Search Logic ==========
async function performSearch() {
    const searchFieldLabel = document.getElementById("searchField").value;
    const searchField2Label = document.getElementById("searchField2").value;

    const searchField = mapFieldName(searchFieldLabel);
    const searchField2 = mapFieldName(searchField2Label);

    const rawSearchTerm = document.getElementById("searchTerm").value.trim();
    const rawSearchTerm2 = document.getElementById("searchTerm2").value.trim();

    const normalizedSearchTerm = normalizeCityField(searchField, rawSearchTerm);
    const normalizedSearchTerm2 = normalizeCityField(searchField2, rawSearchTerm2);

    const regex = new RegExp(escapeRegex(normalizedSearchTerm), 'i');
    const regex2 = new RegExp(escapeRegex(normalizedSearchTerm2), 'i');

    const librettoChecked = document.getElementById("librettoCheckbox").checked;
    const translationChecked = document.getElementById("translationCheckbox").checked;

    const minYear = parseInt(document.getElementById("minYear").value);
    const maxYear = parseInt(document.getElementById("maxYear").value);

    try {
        const response = await fetch(jsonUrl);
        const jsonData = await response.json();

        const results = jsonData.filter(entry => {
            const fieldValue = stripHtml(entry[searchField] || "");
            const fieldValue2 = stripHtml(entry[searchField2] || "");
            const librettoValue = entry['libretto'] === 'True';
            const translationValue = entry['traduzione/translation'] === 'True';

            const term1Match = regex.test(fieldValue);
            const term2Match = regex2.test(fieldValue2);

            const year = parseInt(entry['anno/year']);
            const yearInRange = (!isNaN(minYear) && !isNaN(maxYear)) ? (year >= minYear && year <= maxYear) : true;

            return term1Match && term2Match && yearInRange &&
                (!librettoChecked || librettoValue) &&
                (!translationChecked || translationValue);
        });

        document.getElementById("resultCount").textContent = results.length;
        return results;

    } catch (error) {
        console.error("Error fetching or parsing JSON data:", error);
        return [];
    }
}

// ========== Display Results ==========
async function performSearchAndDisplay(event) {
    try {
        const searchTerm = document.getElementById("searchTerm").value.trim();
        const searchTerm2 = document.getElementById("searchTerm2").value.trim();

        if (searchTerm !== "" || searchTerm2 !== "" || event.type === "click" || (event.type === "keypress" && event.key === "Enter")) {
            const results = await performSearch();
            const searchResultsElement = document.getElementById("searchResults");
            searchResultsElement.innerHTML = "";

            if (results.length > 0) {
                const table = createTableHeader(pageLanguage);
                results.forEach(result => {
                    const row = table.insertRow();
                    Object.entries(result).forEach(([key, value]) => {
                        const cell = row.insertCell();

                        if (key === "libretto" || key === "traduzione/translation") {
                            if (value === "True") {
                                cell.textContent = "✅";
                            } else if (value === "False") {
                                cell.textContent = "❌";
                            } else {
                                cell.textContent = value;
                            }
                        } else if (typeof value === 'string' && value.includes('<a href=')) {
                            cell.innerHTML = value;
                        } else {
                            cell.textContent = value;
                        }
                    });
                });
                searchResultsElement.appendChild(table);
            } else {
                const noResults = pageLanguage === "Italian"
                    ? "Nessun risultato per questi termini di ricerca."
                    : "No results found for the specified search criteria.";
                searchResultsElement.innerHTML = `<p style='padding: 20px; text-align: center; color: #666;'>${noResults}</p>`;
            }
        }
    } catch (error) {
        console.error("Error occurred while performing search and displaying results:", error);
        alert("An error occurred while performing the search. Please try again.");
    }
}

// ========== CSV Download ==========
function downloadCSV(data, filename) {
    const csvContent = "data:text/csv;charset=utf-8," + data.map(row => row.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function performSearchAndDownload() {
    try {
        const results = await performSearch();
        if (results.length > 0) {
            const tableData = results.map(result => Object.values(result));
            downloadCSV(tableData, "search_results.csv");
        } else {
            alert("No results found for the specified search criteria.");
        }
    } catch (error) {
        console.error("Error occurred while performing search and downloading CSV:", error);
        alert("An error occurred while downloading. Please try again.");
    }
}

// ========== Reset ==========
function resetSearch() {
    document.getElementById("searchTerm").value = "";
    document.getElementById("searchTerm2").value = "";
    document.getElementById("searchField2").selectedIndex = 0;
    document.getElementById("minYear").value = "";
    document.getElementById("maxYear").value = "";
    document.getElementById("searchResults").innerHTML = "";
    document.getElementById("librettoCheckbox").checked = false;
    document.getElementById("translationCheckbox").checked = false;
    document.getElementById("resultCount").textContent = "0";
}

// ========== Init ==========
async function initialize() {
    await loadCityMap();

    document.getElementById("searchButton").addEventListener("click", (event) => performSearchAndDisplay(event));
    document.getElementById("searchTerm").addEventListener("keypress", (event) => {
        if (event.key === "Enter") performSearchAndDisplay(event);
    });
    document.getElementById("searchTerm2").addEventListener("keypress", (event) => {
        if (event.key === "Enter") performSearchAndDisplay(event);
    });
}

initialize();
