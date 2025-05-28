// URL to your JSON database
const jsonUrl = "https://allacci-digitale.github.io/data/database.json";

// Function to download CSV file
function downloadCSV(data, filename) {
  const csvContent = "data:text/csv;charset=utf-8," + data.map(row => row.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
}

function createTableHeader(language) {
  const table = document.createElement("table");
  table.classList.add("sticky-table");

  const headerRow = table.createTHead().insertRow(); // Use createTHead for better header management

  // Define column names based on language
  const columnNames = {
    "Italian": ["Voce", "Titolo", "Sottotitolo", "Autore", "Genere", "Metro", "Luogo di prima pubblicazione", "Luogo di prima rappresentazione", "Editore", "Anno", "Formato", "Libretto?", "Compositore", "Traduzione?"],
    "English": ["Entry", "Title", "Subtitle", "Author", "Genre", "Mode", "Place of publication", "Performance venue", "Publisher", "Year", "Format", "Libretto?", "Composer", "Translation?"]
  };

  // Insert column names into header row
  columnNames[language].forEach(columnName => {
    const headerCell = document.createElement("th");
    headerCell.textContent = columnName;
    headerRow.appendChild(headerCell);
  });

  return table;
}

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
  // Capitalize the first letter for matching
  const formatted = inputName.charAt(0).toUpperCase() + inputName.slice(1).toLowerCase();
  return cityMap[formatted] || inputName; // fallback to original if not found
}

function normalizeCityField(field, value) {
  const relevantFields = [
    "Luogo di prima pubblicazione",
    "Luogo di prima rappresentazione",
    "Place of publication",
    "Performance venue"
  ];
  return relevantFields.includes(field) ? normalizeCityName(value) : value;
}


// Function to perform the search
async function performSearch() {
  const searchField = document.getElementById("searchField").value;
  const searchField2 = document.getElementById("searchField2").value;

  // Raw user input
  let rawSearchTerm = document.getElementById("searchTerm").value.trim();
  let rawSearchTerm2 = document.getElementById("searchTerm2").value.trim();

  // Normalize city names if needed
  const normalizedSearchTerm = normalizeCityField(searchField, rawSearchTerm);
  const normalizedSearchTerm2 = normalizeCityField(searchField2, rawSearchTerm2);

  // Create regex for matching (case-insensitive)
  const regex = new RegExp(`\\b${normalizedSearchTerm.toLowerCase()}`, 'i');
  const regex2 = new RegExp(`\\b${normalizedSearchTerm2.toLowerCase()}`, 'i');

  const librettoChecked = document.getElementById("librettoCheckbox").checked;
  const translationChecked = document.getElementById("translationCheckbox").checked;

  const minYear = parseInt(document.getElementById("minYear").value);
  const maxYear = parseInt(document.getElementById("maxYear").value);

  try {
    const response = await fetch(jsonUrl);
    const jsonData = await response.json();

    const results = jsonData.filter(entry => {
      const fieldValue = entry[searchField];
      const fieldValue2 = entry[searchField2];
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
    console.error("Errore nella lettura o decodifica del file JSON / Error fetching or parsing JSON data:", error);
    return [];
  }
}


// Function to reset the search
function resetSearch() {
  document.getElementById("searchTerm").value = ""; // Clear search term
  document.getElementById("searchResults").innerHTML = ""; // Clear search results
  document.getElementById("librettoCheckbox").checked = false; // Uncheck libretto checkbox
  document.getElementById("translationCheckbox").checked = false; // Uncheck translation checkbox
}

// Function to perform the search and download CSV
async function performSearchAndDownload() {
  try {
    // Perform the search and get results
    const results = await performSearch();

    // If results are found, download CSV
    if (results.length > 0) {
      // Extract data from results
      const tableData = results.map(result => Object.values(result));
      // Prompt user to download the CSV file
      downloadCSV(tableData, "search_results.csv");
    } else {
      alert("No results found for the specified search criteria.");
    }
  } catch (error) {
    console.error("Error occurred while performing search and downloading CSV:", error);
    alert("An error occurred while performing the search and downloading the CSV. Please try again.");
  }
}

// Function to perform the search and display results
async function performSearchAndDisplay(language, event) {
  try {
    const searchTerm = document.getElementById("searchTerm").value.trim();
    const searchTerm2 = document.getElementById("searchTerm2").value.trim();

    // Perform the search and get results only if search terms are present or if explicitly triggered
    if (searchTerm !== "" || searchTerm2 !== "" || event.type === "click" || (event.type === "keypress" && event.key === "Enter")) {
      // Perform the search and get results
      const results = await performSearch();

      // Display search results
      const searchResultsElement = document.getElementById("searchResults");
      searchResultsElement.innerHTML = ""; // Clear previous results

      if (results.length > 0) {
        const table = createTableHeader(language);

        // Insert data rows
        results.forEach(result => {
          const row = table.insertRow();
          Object.values(result).forEach(value => {
            const cell = row.insertCell();

            // Check if the value contains an anchor tag and set innerHTML accordingly
            if (typeof value === 'string' && value.includes('<a href=')) {
              cell.innerHTML = value;
            } else {
              cell.textContent = value;
            }
          });
        });

        searchResultsElement.appendChild(table);
      } else {
        searchResultsElement.textContent = "Nessun risultato per questi termini di ricerca / No results found for the specified search criteria.";
      }
    }
  } catch (error) {
    console.error("Error occurred while performing search and displaying results:", error);
    alert("An error occurred while performing the search and displaying results. Please try again.");
  }
}

loadCityMap();

// Event listeners for search button click and enter key press in search fields
document.getElementById("searchButton").addEventListener("click", (event) => performSearchAndDisplay(pageLanguage, event));
document.getElementById("searchTerm").addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    performSearchAndDisplay(pageLanguage, event);
  }
});
document.getElementById("searchTerm2").addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    performSearchAndDisplay(pageLanguage, event);
  }
});

// Determine page language
const pageLanguage = (window.location.pathname === "/database.html") ? "Italian" : "English";
