document.addEventListener('DOMContentLoaded', () => {
    fetch('/public/comparison.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('comparison-section-placeholder').innerHTML = data;
            document.getElementById('view-comparison-btn').addEventListener('click', showComparisonDialog);
            updateComparisonSlots();
        });
});

function updateComparisonSlots() {
    const comparisonSlots = document.querySelectorAll('.comparison-slot');
    const comparisonBikes = JSON.parse(localStorage.getItem('comparisonBikes')) || [];

    comparisonSlots.forEach((slot, index) => {
        const bike = comparisonBikes[index];
        if (bike) {
            slot.innerHTML = `<img src="${bike.imageUrl}" alt="${bike.make} ${bike.model}" class="w-full h-full object-cover rounded-full">`;
            slot.classList.add('has-bike');
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
    dialog.innerHTML = `
        <div class="comparison-dialog-content">
            <h2 class="text-2xl font-bold mb-4">Comparison</h2>
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Feature</th>
                        ${comparisonBikes.map(bike => `<th>${bike.make} ${bike.model}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Price</td>
                        ${comparisonBikes.map(bike => `<td>$${bike.price}</td>`).join('')}
                    </tr>
                    <tr>
                        <td>Year</td>
                        ${comparisonBikes.map(bike => `<td>${bike.year}</td>`).join('')}
                    </tr>
                    <tr>
                        <td>Rating</td>
                        ${comparisonBikes.map(bike => `<td>${bike.averageRating ? bike.averageRating.toFixed(1) : 'N/A'}</td>`).join('')}
                    </tr>
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