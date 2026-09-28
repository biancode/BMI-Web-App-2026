// script.js
new Chart(document.getElementById('myChart'), {
    type: 'bar',
    data: {
        labels: ['Mon', 'Tue', 'Wed'],
        datasets: [{ label: 'Visitors', data: [12, 19, 7] }]
    }
});