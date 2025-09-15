document.addEventListener('DOMContentLoaded', () => {
    fetch('/public/comparison.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('comparison-section-placeholder').innerHTML = data;
            initComparison();
        });
});

function getResizedImageUrl(originalUrl, sizeName) {
    if (!originalUrl) return '';
    const parts = originalUrl.split('.');
    const extension = parts.pop();
    const base = parts.join('.');
    return `${base}_${sizeName}.${extension}`;
}

function initComparison() {
    document.getElementById('view-comparison-btn').addEventListener('click', showComparisonDialog);
    updateComparisonSlots();
}

function updateComparisonSlots() {
    const comparisonSlots = document.querySelectorAll('.comparison-slot');
    let comparisonBikes = JSON.parse(localStorage.getItem('comparisonBikes')) || [];

    comparisonSlots.forEach((slot, index) => {
        const bike = comparisonBikes[index];

        if (bike) {
            slot.innerHTML = `<img src="${getResizedImageUrl(bike.imageUrl, 'thumbnail')}" alt="${bike.make} ${bike.model}" class="w-full h-full object-cover rounded-full"><div class="remove-bike-icon material-symbols-outlined">close</div>`;
            slot.classList.add('has-bike');
            slot.querySelector('.remove-bike-icon').addEventListener('click', (e) => {
                e.stopPropagation();
                comparisonBikes.splice(index, 1);
                localStorage.setItem('comparisonBikes', JSON.stringify(comparisonBikes));
                updateComparisonSlots();
            });
        } else {
            slot.innerHTML = `${index + 1}`;
            slot.classList.remove('has-bike');
        }
    });
}

function showComparisonDialog() {
    const comparisonBikes = JSON.parse(localStorage.getItem('comparisonBikes')) || [];
    const dialog = document.createElement('div');
    dialog.classList.add('comparison-dialog');

    const allSpecKeys = [...new Set(comparisonBikes.flatMap(bike => Object.keys(bike.specs || {})))];

    dialog.innerHTML = `
        <div class="comparison-dialog-content">
            <table class="comparison-table">
                <thead>
                    <tr class="bg-slate-100 rounded-tl-lg rounded-tr-lg">
                        <th></th>
                        ${comparisonBikes.map(bike => `
                            <th>
                                <div class="flex items-center">
                                    <img src="${getResizedImageUrl(bike.imageUrl, 'medium')}" alt="${bike.make} ${bike.model}" class="w-14 h-14 object-cover rounded-full mr-2">
                                    <div>
                                        <span>${bike.make} ${bike.model}</span>
                                        <div class="flex items-center">
                                            ${[...Array(5)].map((_, i) => `
                                                <span class="material-symbols-outlined ${i < bike.averageRating ? 'text-yellow-500' : 'text-gray-300'}" style="font-variation-settings: 'FILL' 1">star</span>
                                            `).join('')}
                                            <span class="ml-2 text-gray-600">${bike.averageRating ? bike.averageRating.toFixed(1) : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="py-2 font-bold text-slate-600">Price</td>
                        ${comparisonBikes.map(bike => `<td class="font-bold">$${bike.price}</td>`).join('')}
                    </tr>
                    <tr>
                        <td class="py-2 font-bold text-slate-600">Year</td>
                        ${comparisonBikes.map(bike => `<td>${bike.year}</td>`).join('')}
                    </tr>
                    ${allSpecKeys.map(key => {
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        return `
                            <tr>
                                <td class="py-2 font-bold text-slate-800">${formattedKey}</td>
                                ${comparisonBikes.map(bike => `<td>${bike.specs?.[key] || 'N/A'}</td>`).join('')}
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <button id="close-comparison-btn" class="bg-cyan-500 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded mt-4">Close</button>
        </div>
    `;
    document.body.appendChild(dialog);

    const closeBtn = document.getElementById('close-comparison-btn');
    closeBtn.addEventListener('click', () => {
        dialog.remove();
    });
}