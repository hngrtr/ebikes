async function displayBikeDetails(bikeId) {
    logClientInfo("displayBikeDetails called");
    try {
        const response = await fetch(`/api/bikes/${bikeId}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }
        const bike = await response.json();
        logClientInfo("Bike details fetched");

        const bikeImage = document.getElementById('bike-image');
        const bikeInfo = document.getElementById('bike-info');
        const commentsList = document.getElementById('comments-list');

        bikeImage.innerHTML = `
            <div class="image-container">
                <img src="${getResizedImageUrl(bike.imageUrl, 'large')}" alt="${bike.make} ${bike.model}" class="w-full rounded-lg">
                <figcaption class="image-caption">${bike.make} ${bike.model} (${bike.year})</figcaption>
            </div>
        `;

        let comparisonBikes = JSON.parse(localStorage.getItem('comparisonBikes')) || [];
        const isCompared = comparisonBikes.some(cb => cb._id === bike._id);

        bikeInfo.innerHTML = `
            <h3 class="text-sm font-bold text-slate-500">${bike.make}</h3>
            <h1 class="text-4xl font-bold mb-4 font-marker">${bike.model} (${bike.year})</h1>
            <div class="flex items-center mb-4">
                ${[...Array(5)].map((_, i) => `
                    <span class="material-symbols-outlined ${i < bike.averageRating ? 'text-yellow-500' : 'text-gray-300'}" style="font-variation-settings: 'FILL' 1">star</span>
                `).join('')}
                <span class="ml-2 text-gray-600">${bike.averageRating ? bike.averageRating.toFixed(1) : 'No ratings'}</span>
                <span class="ml-1 text-gray-400">(${bike.ratingCount || 0})</span>
            </div>
            <p class="text-gray-700 text-lg mb-4">${bike.description}</p>
            <p class="text-3xl font-bold mb-4">$${bike.price}</p>
            <button id="comparison-btn" class="bg-cyan-500 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded">${isCompared ? 'Remove from My List' : 'Add to My List'}</button>
        `;

        if (bike.specs) {
            const specsTable = document.createElement('table');
            specsTable.classList.add('w-full', 'text-left', 'mt-8');
            let tableContent = '<tbody class="divide-y divide-gray-200">';
            for (const [key, value] of Object.entries(bike.specs)) {
                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                tableContent += `
                    <tr>
                        <td class="py-2 font-bold text-slate-800">${formattedKey}</td>
                        <td class="py-2">${value}</td>
                    </tr>
                `;
            }
            tableContent += '</tbody>';
            specsTable.innerHTML = tableContent;
            bikeInfo.appendChild(specsTable);
        }

        if (bike.comments && bike.comments.length > 0) {
            const bgColors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100'];
            commentsList.innerHTML = bike.comments.map((comment, index) => `
                <div class="comment-container">
                    <div class="comment-card">
                        <svg class="comment-arrow" width="40" height="20" viewBox="0 0 40 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 0 L0 20 L40 20 Z" fill="white"/>
                        </svg>
                        <p class="comment-text">“${comment.comment}”</p>
                    </div>
                    <div class="author-bubble ${bgColors[index % bgColors.length]}">
                        <img src="${comment.avatarUrl}" alt="${comment.userId}" class="avatar">
                        <span class="author-name">${comment.userId}</span>
                    </div>
                </div>
            `).join('');
        } else {
            commentsList.innerHTML = '<p class="text-gray-600">No comments yet.</p>';
        }

        const comparisonBtn = document.getElementById('comparison-btn');
        comparisonBtn.addEventListener('click', () => {
            let comparisonBikes = JSON.parse(localStorage.getItem('comparisonBikes')) || [];
            const isCompared = comparisonBikes.some(cb => cb._id === bike._id);

            if (isCompared) {
                comparisonBikes = comparisonBikes.filter(cb => cb._id !== bike._id);
                comparisonBtn.textContent = 'Remove from My List';
            } else {
                if (comparisonBikes.length < 3) {
                    comparisonBikes.push(bike);
                    comparisonBtn.textContent = 'Add to My List';
                } else {
                    alert('You can only compare up to 3 bikes.');
                }
            }

            localStorage.setItem('comparisonBikes', JSON.stringify(comparisonBikes));
            updateComparisonSlots();
        });

    } catch (error) {
        logClientError('Error fetching bike details', error);
        document.getElementById('detail-page').innerHTML = `<p class="text-red-500 text-center">Error loading bike details: ${error.message}. Please try again later.</p>`;
    }
}

// Client-side logging helper (duplicated from app.js for now)
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

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const bikeId = urlParams.get('id');
    if (bikeId) {
        displayBikeDetails(bikeId);
    }
});

// Add event listener for back to main button
document.getElementById('back-to-main').addEventListener('click', (e) => {
    e.preventDefault();
    window.history.back();
});