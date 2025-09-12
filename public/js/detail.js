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
        bikeInfo.innerHTML = `
            <h1 class="text-4xl font-bold mb-4 font-marker">${bike.make} ${bike.model} (${bike.year})</h1>
            <div class="flex items-center mb-4">
                ${[...Array(5)].map((_, i) => `
                    <span class="material-symbols-outlined ${i < bike.averageRating ? 'text-yellow-500' : 'text-gray-300'}" style="font-variation-settings: 'FILL' 1">star</span>
                `).join('')}
                <span class="ml-2 text-gray-600">${bike.averageRating ? bike.averageRating.toFixed(1) : 'No ratings'}</span>
                <span class="ml-1 text-gray-400">(${bike.ratingCount || 0})</span>
            </div>
            <p class="text-gray-700 text-lg mb-4">${bike.description}</p>
            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Add to Comparison</button>
        `;

        if (bike.comments && bike.comments.length > 0) {
            const bgColors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100'];
            commentsList.innerHTML = bike.comments.map((comment, index) => `
                <div class="comment-container">
                    <div class="comment-card">
                        <svg class="comment-arrow" width="40" height="20" viewBox="0 0 40 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 0 H40 C20 10, 10 20, 0 20 Z" fill="white"/>
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