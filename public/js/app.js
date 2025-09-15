console.log("app.js started");

let bikesOnPage = [];
const bikeList = document.getElementById('bike-list');
const firstBtn = document.getElementById('first-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const lastBtn = document.getElementById('last-btn');
const pageNumbers = document.getElementById('page-numbers');

let currentPage = 1;
const urlParams = new URLSearchParams(window.location.search);
const pageParam = urlParams.get('page');
if (pageParam) {
    currentPage = parseInt(pageParam);
}
const bikesPerPage = 8;
let numPages = 0;

function displayBikes() {
    console.log("displayBikes called");
    bikeList.innerHTML = '';
    if (!Array.isArray(bikesOnPage)) {
        console.error("bikesOnPage is not an array:", bikesOnPage);
        return;
    }
    console.log("paginatedBikes (bikesOnPage) in displayBikes:", bikesOnPage);
    for (const bike of bikesOnPage) {
        const bikeElement = document.createElement('article');
        bikeElement.classList.add('bike', 'bg-white', 'rounded-2xl', 'shadow-md', 'overflow-hidden', 'p-4');
        bikeElement.innerHTML = `
            <a href="/public/detail.html?id=${bike._id}">
                <img src="${bike.imageUrl}" alt="${bike.make} ${bike.model}" class="w-full aspect-square object-cover rounded-lg">
                <div class="p-3">
                    <h3 class="text-sm font-bold text-slate-500">${bike.make}</h3>
                    <h2 class="text-2xl font-bold mb-4 font-marker">${bike.model} (${bike.year})</h2>
                    <div class="flex items-center">
                        ${[...Array(5)].map((_, i) => `
                            <span class="material-symbols-outlined ${i < bike.averageRating ? 'text-yellow-500' : 'text-gray-300'}" style="font-variation-settings: 'FILL' 1">star</span>
                        `).join('')}
                        <span class="ml-2 text-gray-600">${bike.averageRating ? bike.averageRating.toFixed(1) : 'No ratings'}</span>
                        <span class="ml-1 text-gray-400">(${bike.ratingCount || 0})</span>
                    </div>
                </div>
            </a>
        `;
        bikeList.appendChild(bikeElement);
    }

    // Update URL with current page
    // history.pushState({ page: currentPage }, '', `/?page=${currentPage}`);
}

function setupPagination() {

    firstBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage = 1;
            fetchBikes();
            updatePaginationButtons();
            updatePageNumberButtons();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchBikes();
            updatePaginationButtons();
            updatePageNumberButtons();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage < numPages) {
            currentPage++;
            fetchBikes();
            updatePaginationButtons();
            updatePageNumberButtons();
        }
    });

    lastBtn.addEventListener('click', () => {
        if (currentPage < numPages) {
            currentPage = numPages;
            fetchBikes();
            updatePaginationButtons();
            updatePageNumberButtons();
        }
    });
}

function updatePageNumberButtons() {
    console.log("updatePageNumberButtons called. CurrentPage:", currentPage, "numPages:", numPages);
    pageNumbers.innerHTML = '';

    const maxButtons = 4;
    let startPage, endPage;

    if (numPages <= maxButtons) {
        startPage = 1;
        endPage = numPages;
    } else {
        const maxPagesBeforeCurrent = Math.floor(maxButtons / 2);
        const maxPagesAfterCurrent = Math.ceil(maxButtons / 2) - 1;

        startPage = currentPage - maxPagesBeforeCurrent;
        endPage = currentPage + maxPagesAfterCurrent;

        // Adjust startPage and endPage to stay within bounds
        if (startPage < 1) {
            endPage += (1 - startPage); // Shift endPage to maintain maxButtons count
            startPage = 1;
        }
        if (endPage > numPages) {
            startPage -= (endPage - numPages); // Shift startPage to maintain maxButtons count
            endPage = numPages;
        }
        // Re-adjust startPage if it went below 1 after shifting for endPage
        if (startPage < 1) {
            startPage = 1;
        }
    }

    if (startPage > 1) {
        const dots = document.createElement('span');
        dots.textContent = '...';
        dots.classList.add('px-4', 'py-4', 'text-gray-500');
        pageNumbers.appendChild(dots);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.add('px-4', 'py-4', 'border-gray-200', 'mr-2', 'w-10', 'h-10', 'rounded-full', 'flex', 'items-center', 'justify-center');
        if (i === currentPage) {
            pageButton.classList.add('bg-cyan-500', 'text-white');
        } else {
            pageButton.classList.add('bg-white');
        }
        pageButton.addEventListener('click', () => {
            currentPage = i;
            fetchBikes();
            updatePaginationButtons();
            updatePageNumberButtons();
        });
        pageNumbers.appendChild(pageButton);
    }

    if (endPage < numPages) {
        const dots = document.createElement('span');
        dots.textContent = '...';
        dots.classList.add('px-4', 'py-4', 'text-gray-500');
        pageNumbers.appendChild(dots);
    }
}

function updatePaginationButtons() {
    firstBtn.disabled = currentPage === 1;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === numPages;
    lastBtn.disabled = currentPage === numPages;
}

async function fetchBikes() {
    console.log("fetchBikes called");
    console.log("currentPage before fetch:", currentPage);
    const urlForFetch = `/api/bikes?page=${currentPage}&limit=${bikesPerPage}`;
    console.log("URL for fetch:", urlForFetch);
    try {
        const response = await fetch(urlForFetch);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("API response data:", data);
        bikesOnPage = data.bikes || [];
        console.log("bikesOnPage after fetch:", bikesOnPage);
        bikesOnPage.forEach(bike => console.log("Bike ID:", bike._id)); // Log bike IDs
        numPages = data.totalPages;
        // currentPage is already set or updated by pageParam, or defaults to 1

        // Update URL after successful fetch and currentPage is finalized
        console.log("Pushing state for page:", currentPage);
        history.pushState({ page: currentPage }, '', `/?page=${currentPage}`);

        displayBikes();
        updatePaginationButtons();
        updatePageNumberButtons();
    } catch (error) {
        console.error('Error fetching bike data:', error);
        bikeList.innerHTML = '<p class="text-red-500 text-center">Error loading bike data. Please try again later.</p>';
    } finally {
    }
}

// Handle browser back/forward buttons
window.onpopstate = function(event) {
    if (event.state && event.state.page) {
        currentPage = event.state.page;
        fetchBikes();
        updatePaginationButtons();
        updatePageNumberButtons();
    } else {
        // If no state, default to page 1
        currentPage = 1;
        fetchBikes();
        updatePaginationButtons();
        updatePageNumberButtons();
    }
};

fetchBikes();
setupPagination();