// URL to your JSON database
const jsonUrl = "https://allacci-digitale.github.io/data/database.json";

// Function to perform the search
async function performSearch() {
  const searchField = document.getElementById("searchField").value;
  const searchTerm = document.getElementById("searchTerm").value.toLowerCase();

  const searchField2 = document.getElementById("searchField2").value;
  const searchTerm2 = document.getElementById("searchTerm2").value.toLowerCase();

  const librettoChecked = document.getElementById("librettoCheckbox").checked;
  const translationChecked = document.getElementById("translationCheckbox").checked;

// Get the year range
  const minYear = parseInt(document.getElementById("minYear").value);
  const maxYear = parseInt(document.getElementById("maxYear").value);


  try {
    // Fetch the JSON data
    const response = await fetch(jsonUrl);
    const jsonData = await response.json();

    // Create regular expressions to match the search terms as whole words
    const regex = new RegExp(`\\b${searchTerm}\\b`, 'i');
    const regex2 = new RegExp(`\\b${searchTerm2}\\b`, 'i');

    // Filter the data based on search criteria
    const results = jsonData.filter(entry => {
      const fieldValue = entry[searchField];
      const fieldValue2 = entry[searchField2];
      const librettoValue = entry['libretto'] === 'True';
      const translationValue = entry['translation'] === 'True';

      // Check if both search terms are present in their respective fields
      const term1Match = regex.test(fieldValue);
      const term2Match = regex2.test(fieldValue2);

      // Check if the year falls within the specified range
      const year = parseInt(entry['year']);
      const yearInRange = (!isNaN(minYear) && !isNaN(maxYear)) ? (year >= minYear && year <= maxYear) : true;

      return term1Match && term2Match && yearInRange &&
        (!librettoChecked || librettoValue) &&
        (!translationChecked || translationValue);
    });
    
    // Display search results
    const searchResultsElement = document.getElementById("searchResults");
    searchResultsElement.innerHTML = ""; // Clear previous results

    if (results.length > 0) {
      const table = document.createElement("table");
      const headerRow = table.insertRow();
      Object.keys(results[0]).forEach(key => {
        const headerCell = headerRow.insertCell();
        headerCell.textContent = key;
      });

      results.forEach(result => {
        const row = table.insertRow();
        Object.values(result).forEach(value => {
          const cell = row.insertCell();
          cell.textContent = value;
        });
      });

      searchResultsElement.appendChild(table);
    } else {
      searchResultsElement.textContent = "Nessun risultato per questi termini di ricerca / No results found for the specified search criteria.";
    }
  } catch (error) {
    console.error("Errore nella lettura o decodifica del file JSON / Error fetching or parsing JSON data:", error);
  }
}

// Function to reset the search
function resetSearch() {
  document.getElementById("searchTerm").value = ""; // Clear search term
  document.getElementById("searchResults").innerHTML = ""; // Clear search results
  document.getElementById("librettoCheckbox").checked = false; // Uncheck libretto checkbox
  document.getElementById("translationCheckbox").checked = false; // Uncheck translation checkbox
}
