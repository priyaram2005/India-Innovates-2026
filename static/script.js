// ===============================
// GLOBAL CHART INSTANCES
// ===============================
let categoryChartInstance = null;
let priorityChartInstance = null;


// ===============================
// PREDICT FUNCTION
// ===============================
function predict() {

    const complaintText = document.getElementById("complaint").value;
    const locationType = document.getElementById("location_type").value;
    const daysPending = document.getElementById("days").value;

    if (!complaintText || !locationType || daysPending === "") {
        alert("Please fill all fields!");
        return;
    }

    fetch("/predict", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            text: complaintText,
            location_type: locationType,
            days_pending: parseInt(daysPending)
        })
    })
    .then(response => response.json())
    .then(data => {

        console.log("API Response:", data);

        if (data.error) {
            alert(data.error);
            return;
        }

        document.getElementById("category").innerText = data.category;
        document.getElementById("department").innerText = data.department;
        document.getElementById("severity").innerText = data.severity;

        // ===============================
        // PRIORITY COLOR CODING
        // ===============================
        const priorityElement = document.getElementById("priority");
        priorityElement.innerText = data.priority;
        priorityElement.className = "";

        if (data.priority === "High") {
            priorityElement.classList.add("high");
        } else if (data.priority === "Medium") {
            priorityElement.classList.add("medium");
        } else {
            priorityElement.classList.add("low");
        }

        document.getElementById("result").style.display = "block";

        // Refresh analytics
        loadStats();
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Something went wrong.");
    });
}


// ===============================
// LOAD STATS FUNCTION
// ===============================
function loadStats() {

    fetch("/stats")
    .then(response => response.json())
    .then(data => {

        if (!data || Object.keys(data).length === 0) {
            return;
        }

        document.getElementById("total").innerText = data.total_complaints;
        document.getElementById("avg_days").innerText = data.average_days_pending;

        renderCharts(
            data.category_distribution,
            data.priority_distribution
        );

        document.getElementById("stats_section").style.display = "block";
    })
    .catch(error => {
        console.error("Stats Error:", error);
    });
}


// ===============================
// RENDER CHARTS FUNCTION
// ===============================
function renderCharts(categoryData, priorityData) {

    // Destroy old charts before re-rendering
    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    if (priorityChartInstance) {
        priorityChartInstance.destroy();
    }

    // ===============================
    // CATEGORY PIE CHART
    // ===============================
    const ctx1 = document.getElementById("categoryChart").getContext("2d");

    categoryChartInstance = new Chart(ctx1, {
        type: "pie",
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: [
                    "#4e73df",
                    "#1cc88a",
                    "#f6c23e",
                    "#e74a3b",
                    "#36b9cc"
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });

    // ===============================
    // PRIORITY BAR CHART
    // ===============================
    const ctx2 = document.getElementById("priorityChart").getContext("2d");

    priorityChartInstance = new Chart(ctx2, {
        type: "bar",
        data: {
            labels: Object.keys(priorityData),
            datasets: [{
                label: "Number of Complaints",
                data: Object.values(priorityData),
                backgroundColor: [
                    "#e74a3b",   // High
                    "#f6c23e",   // Medium
                    "#1cc88a"    // Low
                ]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}


// ===============================
// AUTO LOAD STATS ON PAGE LOAD
// ===============================
window.onload = function () {
    loadStats();
};