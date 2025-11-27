let currentPage = 1;
let totalPages = 0;
let currentSearchTerm = '';
let yearFrom = '';
let yearTo = '';
let allFilteredMovies = [];

function searchInput() {
    const searchTerm = document.getElementById('search-input').value.trim();
    if (searchTerm !== '') {
        currentSearchTerm = searchTerm;
        currentPage = 1;
        allFilteredMovies = [];
        searchMovies(searchTerm, currentPage);
    } else {
        alert('Inserisci un termine di ricerca');
    }
}

function searchMovies(searchTerm, page) {
    let url = `https://www.omdbapi.com/?apikey=${ApiKey}&s=${encodeURIComponent(searchTerm)}&page=${page}`;
    
    console.log("URL di ricerca:", url);
    
    document.getElementById('movies-container').innerHTML = '<div style="color: white; text-align: center; grid-column: 1 / -1;">Caricamento...</div>';
    document.getElementById('results-section').style.display = 'block';
    document.getElementById('pagination').style.display = 'none';
    document.getElementById('no-results').style.display = 'none';
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log("Risposta API:", data);
            if (data.Response === "True") {
                displayMovies(data);
                setupPagination(data);
            } else {
                throw new Error(data.Error || "Errore dall'API");
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('movies-container').innerHTML = '<div style="color: white; text-align: center; grid-column: 1 / -1;">Errore: ' + error.message + '</div>';
        });
}

function applyYearFilter() {
    yearFrom = document.getElementById('year-from').value;
    yearTo = document.getElementById('year-to').value;
    
    if (yearFrom && yearTo && parseInt(yearFrom) > parseInt(yearTo)) {
        alert("L'anno 'da' non può essere maggiore dell'anno 'a'");
        return;
    }
    
    document.getElementById('year-from').classList.toggle('active-filter', yearFrom !== '');
    document.getElementById('year-to').classList.toggle('active-filter', yearTo !== '');
    
    if (currentSearchTerm) {
        currentPage = 1;
        allFilteredMovies = [];
        searchMovies(currentSearchTerm, currentPage);
    } else {
        alert("Prima effettua una ricerca!");
    }
}

function clearYearFilter() {
    document.getElementById('year-from').value = '';
    document.getElementById('year-to').value = '';
    document.getElementById('year-from').classList.remove('active-filter');
    document.getElementById('year-to').classList.remove('active-filter');
    
    yearFrom = '';
    yearTo = '';
    
    if (currentSearchTerm) {
        currentPage = 1;
        allFilteredMovies = [];
        searchMovies(currentSearchTerm, currentPage);
    }
}

function displayMovies(data) {
    const moviesContainer = document.getElementById('movies-container');
    const noResults = document.getElementById('no-results');
    
    if (data.Response === "True" && data.Search) {
        moviesContainer.innerHTML = '';
        noResults.style.display = 'none';
        
        let filteredMovies = data.Search.filter(movie => {
            const movieYear = parseInt(movie.Year);
            
            if (yearFrom && yearTo) {
                return movieYear >= parseInt(yearFrom) && movieYear <= parseInt(yearTo);
            } else if (yearFrom) {
                return movieYear >= parseInt(yearFrom);
            } else if (yearTo) {
                return movieYear <= parseInt(yearTo);
            } else {
                return true;
            }
        });
        
        console.log(`Film trovati: ${data.Search.length}, Film filtrati: ${filteredMovies.length}`);
        
        if (currentPage === 1) {
            allFilteredMovies = filteredMovies;
        } else {
            allFilteredMovies = allFilteredMovies.concat(filteredMovies);
        }
        
        if (filteredMovies.length === 0) {
            moviesContainer.innerHTML = '';
            noResults.style.display = 'block';
            let message = "Nessun film trovato";
            if (yearFrom && yearTo) {
                message += ` nel range di anni ${yearFrom}-${yearTo}`;
            } else if (yearFrom) {
                message += ` dall'anno ${yearFrom} in poi`;
            } else if (yearTo) {
                message += ` fino all'anno ${yearTo}`;
            }
            message += " in questa pagina.";
            noResults.innerHTML = `<p>${message}</p>`;
            
            checkNextPages();
            return;
        }
        
        updateGridLayout(filteredMovies.length);
        
        filteredMovies.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            
            const poster = movie.Poster !== "N/A" ? 
                `<img src="${movie.Poster}" alt="${movie.Title}" class="movie-poster" onerror="this.style.display='none';">` :
                `<div class="no-poster">Nessuna locandina</div>`;
            
            movieCard.innerHTML = `
                ${poster}
                <div class="movie-title">${movie.Title}</div>
                <div class="movie-year">${movie.Year}</div>
            `;
            
            moviesContainer.appendChild(movieCard);
        });
        
        updateResultsTitle(filteredMovies.length, data.Search.length);
        
    } else {
        moviesContainer.innerHTML = '';
        noResults.style.display = 'block';
        if (data.Error) {
            noResults.innerHTML = `<p>Errore: ${data.Error}</p>`;
        } else {
            noResults.innerHTML = `<p>Nessun film trovato. Prova con un altro titolo!</p>`;
        }
    }
}


function updateGridLayout(movieCount) {
    const moviesContainer = document.getElementById('movies-container');
    
    // Ripristina il layout normale
    moviesContainer.style.gridTemplateColumns = '';
    moviesContainer.style.justifyItems = '';
    moviesContainer.style.maxWidth = '';
    moviesContainer.style.margin = '';
    
    // Layout speciali per numeri piccoli
    if (movieCount === 1) {
        moviesContainer.style.gridTemplateColumns = '1fr';
        moviesContainer.style.justifyItems = 'center';
        moviesContainer.style.maxWidth = '300px';
        moviesContainer.style.margin = '0 auto';
    } else if (movieCount === 2) {
        moviesContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
        moviesContainer.style.maxWidth = '600px';
        moviesContainer.style.margin = '0 auto';
    } else if (movieCount === 3) {
        moviesContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
        moviesContainer.style.maxWidth = '900px';
        moviesContainer.style.margin = '0 auto';
    }

}

function updateResultsTitle(filteredCount, totalCount) {
    const resultsTitle = document.getElementById('results-title');
    let titleText = 'Risultati della ricerca';
    
    if (yearFrom || yearTo) {
        let filterText = '';
        if (yearFrom && yearTo) {
            filterText = ` (Filtrati: ${filteredCount} di ${totalCount} nel range ${yearFrom}-${yearTo})`;
        } else if (yearFrom) {
            filterText = ` (Filtrati: ${filteredCount} di ${totalCount} dal ${yearFrom})`;
        } else if (yearTo) {
            filterText = ` (Filtrati: ${filteredCount} di ${totalCount} fino al ${yearTo})`;
        }
        titleText += filterText;
    }
    
    resultsTitle.textContent = titleText;
}

function checkNextPages() {
    if (currentPage >= totalPages) {
        const noResults = document.getElementById('no-results');
        noResults.innerHTML += `<p style="margin-top: 10px; font-size: 14px; color: #ccc;">Nessun altro film trovato nelle pagine successive.</p>`;
        return;
    }
    
    const noResults = document.getElementById('no-results');
    noResults.innerHTML += `
        <div style="margin-top: 15px;">
            <button onclick="goToNextPageWithResults()" class="search-btn" style="padding: 8px 16px; font-size: 14px;">
                Cerca nella pagina successiva ›
            </button>
        </div>
    `;
}

function goToNextPageWithResults() {
    if (currentPage < totalPages) {
        currentPage++;
        searchMovies(currentSearchTerm, currentPage);
    }
}

function setupPagination(data) {
    const pagination = document.getElementById('pagination');
    
    if (data.Response === "True" && data.totalResults) {
        const totalResults = parseInt(data.totalResults);
        totalPages = Math.ceil(totalResults / 10);
        totalPages = Math.min(totalPages, 10);
        
        console.log(`Pagine totali: ${totalPages}, Risultati totali: ${totalResults}`);
        
        if (totalPages > 1) {
            pagination.style.display = 'flex';
            updatePageNumbers();
        } else {
            pagination.style.display = 'none';
        }
    } else {
        pagination.style.display = 'none';
    }
}

function updatePageNumbers() {
    const pageNumbers = document.getElementById('page-numbers');
    pageNumbers.innerHTML = '';
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageNumber = document.createElement('div');
        pageNumber.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageNumber.textContent = i;
        pageNumber.onclick = () => goToPage(i);
        pageNumbers.appendChild(pageNumber);
    }
    
    document.getElementById('prev-btn').disabled = currentPage === 1;
    document.getElementById('next-btn').disabled = currentPage === totalPages;
}

function goToPage(page) {
    currentPage = page;
    searchMovies(currentSearchTerm, currentPage);
    window.scrollTo({ top: document.getElementById('results-section').offsetTop, behavior: 'smooth' });
}

function clearInput() {
    document.getElementById('search-input').value = '';
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('pagination').style.display = 'none';
    document.getElementById('no-results').style.display = 'none';
    clearYearFilter();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('prev-btn').onclick = () => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    };

    document.getElementById('next-btn').onclick = () => {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    };

    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchInput();
        }
    });

    document.getElementById('year-from').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyYearFilter();
        }
    });

    document.getElementById('year-to').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyYearFilter();
        }
    });
});