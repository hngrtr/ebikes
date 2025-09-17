console.log("app.js started");

let bikesOnPage = [];
const bikeList = document.getElementById('bike-list');
const paginationInfo = document.getElementById('pagination-info'); // New element for pagination text

let currentPage = 1;
const urlParams = new URLSearchParams(window.location.search);
const pageParam = urlParams.get('page');
if (pageParam) {
    currentPage = parseInt(pageParam);
}
const bikesPerPage = 12;
let numPages = 0;
let totalBikesCount = 0; // To store the total number of bikes

// Client-side logging helper
async function logClientError(message, error) {
    const logData = {
        level: 'error',
        message: message,
        url: window.location.href,
        stack: error ? error.stack : 'No stack trace available'
    };
    try {
        await fetch('/api/log/client', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logData),
        });
    } catch (e) {
        console.error('Failed to send client log to server:', e);
    }
}

async function logClientInfo(message) {
    const logData = {
        level: 'info',
        message: message,
        url: window.location.href,
    };
    try {
        await fetch('/api/log/client', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logData),
        });
    } catch (e) {
        console.error('Failed to send client log to server:', e);
    }
}

function getResizedImageUrl(originalUrl, sizeName) {
    if (!originalUrl) return '';

    // Find the last dot to separate base and extension
    const lastDotIndex = originalUrl.lastIndexOf('.');
    if (lastDotIndex === -1) {
        // No extension, just append sizeName
        return `${originalUrl}_${sizeName}`;
    }

    const base = originalUrl.substring(0, lastDotIndex);
    const extension = originalUrl.substring(lastDotIndex); // Includes the dot

    return `${base}_${sizeName}${extension}`;
}

function displayBikes() {
    logClientInfo("displayBikes called");
    bikeList.innerHTML = '';
    if (!Array.isArray(bikesOnPage)) {
        logClientError("bikesOnPage is not an array", new Error("bikesOnPage is not an array"));
        return;
    }
    logClientInfo(`Displaying ${bikesOnPage.length} bikes`);
    for (const bike of bikesOnPage) {
        const bikeElement = document.createElement('article');
        bikeElement.classList.add('bike', 'bg-white', 'rounded-2xl', 'shadow-md', 'overflow-hidden', 'p-4');
        bikeElement.innerHTML = `
            <a href="/public/detail.html?id=${bike._id}">
                <img src="${getResizedImageUrl(bike.imageUrl, 'large')}" alt="${bike.make} ${bike.model}" class="w-full aspect-square object-cover rounded-lg">
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
    const firstBtn = document.getElementById('first-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const lastBtn = document.getElementById('last-btn');

    firstBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage = 1;
            fetchBikes();
            window.scrollTo(0, 0); // Scroll to top
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchBikes();
            window.scrollTo(0, 0); // Scroll to top
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage < numPages) {
            currentPage++;
            fetchBikes();
            window.scrollTo(0, 0); // Scroll to top
        }
    });

    lastBtn.addEventListener('click', () => {
        if (currentPage < numPages) {
            currentPage = numPages;
            fetchBikes();
            window.scrollTo(0, 0); // Scroll to top
        }
    });
}

function updatePaginationDisplay() {
    const paginationInfo = document.getElementById('pagination-info'); // Get element here
    const startItem = (currentPage - 1) * bikesPerPage + 1;
    const endItem = Math.min(currentPage * bikesPerPage, totalBikesCount);
    if (paginationInfo) {
        paginationInfo.textContent = `${startItem} - ${endItem} of ${totalBikesCount}`;
    }

    const firstBtn = document.getElementById('first-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const lastBtn = document.getElementById('last-btn');

    firstBtn.disabled = currentPage === 1;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === numPages;
    lastBtn.disabled = currentPage === numPages;
}

async function fetchBikes() {
    logClientInfo("fetchBikes function called");
    logClientInfo(`Fetching bikes for page ${currentPage}`);
    const urlForFetch = `/api/bikes?page=${currentPage}&limit=${bikesPerPage}`;
    try {
        const response = await fetch(urlForFetch);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }
        const data = await response.json();
        logClientInfo("API response data received");
        bikesOnPage = data.bikes || [];
        logClientInfo(`Bikes on page: ${bikesOnPage.length}`);
        numPages = data.totalPages;
        totalBikesCount = data.totalBikes; 

        history.pushState({ page: currentPage }, '', `/?page=${currentPage}`);

        displayBikes();
        updatePaginationDisplay(); 
    } catch (error) {
        logClientError('Error fetching bike data', error);
        bikeList.innerHTML = `<p class="text-red-500 text-center">Error loading bike data: ${error.message}. Please try again later.</p>`;
    }
}

// Handle browser back/forward buttons
window.onpopstate = function(event) {
    if (event.state && event.state.page) {
        currentPage = event.state.page;
        fetchBikes();
    }
};

fetchBikes();
setupPagination();