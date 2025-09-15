async function displayBikeDetails(bikeId) {
    console.log('displayBikeDetails called with bikeId:', bikeId);
    try {
        const response = await fetch(`/api/bikes/${bikeId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const bike = await response.json();
        console.log('Bike details fetched:', bike);

        const bikeImage = document.getElementById('bike-image');
        const bikeInfo = document.getElementById('bike-info');
        const commentsList = document.getElementById('comments-list');

        bikeImage.innerHTML = `
            <div class="image-container">
                <img src="${bike.imageUrl}" alt="${bike.make} ${bike.model}" class="w-full rounded-lg">
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
                        <td class="py-2 font-bold text-slate-600">${formattedKey}</td>
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
                comparisonBtn.textContent = 'Add to My List';
            } else {
                if (comparisonBikes.length < 3) {
                    comparisonBikes.push(bike);
                    comparisonBtn.textContent = 'Remove from My List';
                } else {
                    alert('You can only compare up to 3 bikes.');
                }
            }

            localStorage.setItem('comparisonBikes', JSON.stringify(comparisonBikes));
            updateComparisonSlots();
        });

    } catch (error) {
        console.error('Error fetching bike details:', error);
        document.getElementById('detail-page').innerHTML = '<p class="text-red-500 text-center">Error loading bike details. Please try again later.</p>';
    }
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