const bikeList = document.getElementById('bike-list');
const firstBtn = document.getElementById('first-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const lastBtn = document.getElementById('last-btn');
const pageNumbers = document.getElementById('page-numbers');

let currentPage = 1;
const bikesPerPage = 12;
let allBikes = [];
let numPages = 0;

function displayBikes(page) {
    bikeList.innerHTML = '';
    const start = (page - 1) * bikesPerPage;
    const end = start + bikesPerPage;
    const paginatedBikes = allBikes.slice(start, end);

    for (const bike of paginatedBikes) {
        const bikeElement = document.createElement('article');
        bikeElement.classList.add('bike', 'bg-white', 'rounded-lg', 'shadow-md', 'overflow-hidden', 'p-4');
        bikeElement.innerHTML = `
            <a href="/bikes/${bike._id}">
                <img src="${bike.imageUrl}" alt="${bike.make} ${bike.model}" class="w-full aspect-square object-cover rounded-md">
                <div>
                    <h2 class="text-lg font-bold mb-2 font-marker">${bike.make} ${bike.model} (${bike.year})</h2>
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
}

function updatePageNumberButtons() {
    pageNumbers.innerHTML = '';

    const maxButtons = 4;
    let startPage, endPage;

    if (numPages <= maxButtons) {
        startPage = 1;
        endPage = numPages;
    } else {
        const maxPagesBeforeCurrent = Math.floor(maxButtons / 2);
        const maxPagesAfterCurrent = Math.ceil(maxButtons / 2) - 1;
        if (currentPage <= maxPagesBeforeCurrent) {
            startPage = 1;
            endPage = maxButtons;
        } else if (currentPage + maxPagesAfterCurrent >= numPages) {
            startPage = numPages - maxButtons + 1;
            endPage = numPages;
        } else {
            startPage = currentPage - maxPagesBeforeCurrent;
            endPage = currentPage + maxPagesAfterCurrent;
        }
    }

    if (startPage > 1) {
        const dots = document.createElement('span');
        dots.textContent = '...';
        dots.classList.add('px-4', 'py-2', 'text-gray-500');
        pageNumbers.appendChild(dots);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.add('px-4', 'py-2', 'border-gray-200', 'mr-2', 'w-10', 'h-10', 'rounded-md', 'flex', 'items-center', 'justify-center');
        if (i === currentPage) {
            pageButton.classList.add('bg-blue-500', 'text-white');
        } else {
            pageButton.classList.add('bg-white');
        }
        pageButton.addEventListener('click', () => {
            currentPage = i;
            displayBikes(currentPage);
            updatePaginationButtons();
            updatePageNumberButtons();
        });
        pageNumbers.appendChild(pageButton);
    }

    if (endPage < numPages) {
        const dots = document.createElement('span');
        dots.textContent = '...';
        dots.classList.add('px-4', 'py-2', 'text-gray-500');
        pageNumbers.appendChild(dots);
    }
}

function setupPagination() {
    numPages = Math.ceil(allBikes.length / bikesPerPage);
    updatePageNumberButtons();
    updatePaginationButtons();

    firstBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage = 1;
            displayBikes(currentPage);
            updatePaginationButtons();
            updatePageNumberButtons();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayBikes(currentPage);
            updatePaginationButtons();
            updatePageNumberButtons();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage < numPages) {
            currentPage++;
            displayBikes(currentPage);
            updatePaginationButtons();
            updatePageNumberButtons();
        }
    });

    lastBtn.addEventListener('click', () => {
        if (currentPage < numPages) {
            currentPage = numPages;
            displayBikes(currentPage);
            updatePaginationButtons();
            updatePageNumberButtons();
        }
    });
}

function updatePaginationButtons() {
    firstBtn.disabled = currentPage === 1;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === numPages;
    lastBtn.disabled = currentPage === numPages;
}

async function fetchBikes() {
    try {
        const response = await fetch('/api/bikes');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allBikes = await response.json();
        displayBikes(currentPage);
        setupPagination();
    } catch (error) {
        console.error('Error fetching bike data:', error);
        bikeList.innerHTML = '<p class="text-red-500 text-center">Error loading bike data. Please try again later.</p>';
    }
}

fetchBikes();