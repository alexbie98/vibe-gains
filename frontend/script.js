class LiftTracker {
    constructor() {
        this.lifts = this.loadLiftsFromStorage();
        this.selectedLift = '';
        this.currentSets = [];
        this.chart = null;
        
        this.commonLifts = [
            'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row',
            'Pull-ups', 'Chin-ups', 'Dips', 'Incline Bench Press', 'Decline Bench Press',
            'Front Squat', 'Romanian Deadlift', 'Sumo Deadlift', 'Close-Grip Bench Press',
            'Wide-Grip Bench Press', 'Lat Pulldown', 'Seated Row', 'T-Bar Row',
            'Shoulder Press', 'Lateral Raises', 'Rear Delt Flyes', 'Bicep Curls',
            'Hammer Curls', 'Tricep Extensions', 'French Press', 'Leg Press',
            'Leg Curls', 'Leg Extensions', 'Calf Raises', 'Shrugs'
        ];
        
        this.initializeEventListeners();
        this.renderDashboard();
        this.renderChart();
    }

    initializeEventListeners() {
        const addBtn = document.getElementById('addBtn');
        const closeModal = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const liftForm = document.getElementById('liftForm');
        const liftSearch = document.getElementById('liftSearch');
        const addSetBtn = document.getElementById('addSetBtn');

        addBtn.addEventListener('click', () => this.showModal());
        closeModal.addEventListener('click', () => this.hideModal());
        cancelBtn.addEventListener('click', () => this.hideModal());
        liftForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        liftSearch.addEventListener('input', (e) => this.handleLiftSearch(e));
        liftSearch.addEventListener('focus', () => this.showDropdown());
        addSetBtn.addEventListener('click', () => this.addSetInput());

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown-container')) {
                this.hideDropdown();
            }
        });
    }

    showModal() {
        document.getElementById('addLiftModal').style.display = 'flex';
        this.resetForm();
        this.addSetInput();
    }

    hideModal() {
        document.getElementById('addLiftModal').style.display = 'none';
        this.resetForm();
    }

    resetForm() {
        document.getElementById('liftSearch').value = '';
        document.getElementById('setsContainer').innerHTML = '';
        this.selectedLift = '';
        this.currentSets = [];
        this.hideDropdown();
    }

    handleLiftSearch(e) {
        const query = e.target.value.toLowerCase();
        this.selectedLift = e.target.value;
        
        if (query.length > 0) {
            const filteredLifts = this.commonLifts.filter(lift => 
                lift.toLowerCase().includes(query)
            );
            this.renderDropdown(filteredLifts);
            this.showDropdown();
        } else {
            this.renderDropdown(this.commonLifts);
            this.showDropdown();
        }
    }

    renderDropdown(lifts) {
        const dropdown = document.getElementById('liftDropdown');
        dropdown.innerHTML = '';
        
        lifts.forEach(lift => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = lift;
            item.addEventListener('click', () => this.selectLift(lift));
            dropdown.appendChild(item);
        });
    }

    showDropdown() {
        document.getElementById('liftDropdown').style.display = 'block';
    }

    hideDropdown() {
        document.getElementById('liftDropdown').style.display = 'none';
    }

    selectLift(lift) {
        document.getElementById('liftSearch').value = lift;
        this.selectedLift = lift;
        this.hideDropdown();
    }

    addSetInput() {
        const container = document.getElementById('setsContainer');
        const setDiv = document.createElement('div');
        setDiv.className = 'set-input';
        
        setDiv.innerHTML = `
            <input type="number" placeholder="Weight (lbs)" min="0" step="0.5" class="weight-input">
            <input type="number" placeholder="Reps" min="1" class="reps-input">
            <button type="button" class="remove-set">×</button>
        `;
        
        setDiv.querySelector('.remove-set').addEventListener('click', () => {
            setDiv.remove();
        });
        
        container.appendChild(setDiv);
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.selectedLift.trim()) {
            alert('Please select an exercise');
            return;
        }

        const setInputs = document.querySelectorAll('.set-input');
        const sets = [];
        
        setInputs.forEach(setInput => {
            const weight = parseFloat(setInput.querySelector('.weight-input').value);
            const reps = parseInt(setInput.querySelector('.reps-input').value);
            
            if (weight > 0 && reps > 0) {
                sets.push({ weight, reps });
            }
        });

        if (sets.length === 0) {
            alert('Please add at least one set with weight and reps');
            return;
        }

        this.saveLift(this.selectedLift, sets);
        this.hideModal();
        this.renderDashboard();
        this.renderChart();
    }

    saveLift(exercise, sets) {
        const today = new Date().toDateString();
        const liftEntry = {
            id: Date.now(),
            exercise,
            sets,
            date: today,
            timestamp: new Date().toISOString()
        };

        this.lifts.push(liftEntry);
        this.saveLiftsToStorage();
    }

    loadLiftsFromStorage() {
        const stored = localStorage.getItem('liftTracker');
        return stored ? JSON.parse(stored) : [];
    }

    saveLiftsToStorage() {
        localStorage.setItem('liftTracker', JSON.stringify(this.lifts));
    }

    renderDashboard() {
        this.renderTodayLifts();
        this.renderAllLifts();
    }

    renderTodayLifts() {
        const container = document.getElementById('todayLifts');
        const today = new Date().toDateString();
        const todayLifts = this.lifts.filter(lift => lift.date === today);

        if (todayLifts.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No lifts recorded today</p><p>Click the + button to add your first lift!</p></div>';
            return;
        }

        container.innerHTML = todayLifts.map(lift => this.renderLiftEntry(lift)).join('');
    }

    renderAllLifts() {
        const container = document.getElementById('allLifts');
        
        if (this.lifts.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No lifts recorded yet</p><p>Start tracking your progress!</p></div>';
            return;
        }

        const sortedLifts = [...this.lifts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        container.innerHTML = sortedLifts.map(lift => this.renderLiftEntry(lift)).join('');
    }

    renderLiftEntry(lift) {
        const maxWeight = Math.max(...lift.sets.map(set => set.weight));
        const totalVolume = lift.sets.reduce((total, set) => total + (set.weight * set.reps), 0);
        
        return `
            <div class="lift-entry">
                <div class="lift-name">${lift.exercise}</div>
                <div class="lift-sets">
                    ${lift.sets.map(set => `<span class="set-info">${set.weight}lbs × ${set.reps}</span>`).join('')}
                </div>
                <div class="lift-date">
                    ${lift.date} • Max: ${maxWeight}lbs • Volume: ${totalVolume}lbs
                </div>
            </div>
        `;
    }

    renderChart() {
        const ctx = document.getElementById('progressChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        const chartData = this.getChartData();
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: chartData.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Max Weight Progress Over Time'
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Weight (lbs)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    getChartData() {
        const exerciseData = {};
        const dates = new Set();

        this.lifts.forEach(lift => {
            const date = lift.date;
            const maxWeight = Math.max(...lift.sets.map(set => set.weight));
            
            dates.add(date);
            
            if (!exerciseData[lift.exercise]) {
                exerciseData[lift.exercise] = {};
            }
            
            if (!exerciseData[lift.exercise][date] || exerciseData[lift.exercise][date] < maxWeight) {
                exerciseData[lift.exercise][date] = maxWeight;
            }
        });

        const sortedDates = Array.from(dates).sort((a, b) => new Date(a) - new Date(b));
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
            '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
        ];

        const datasets = Object.keys(exerciseData).map((exercise, index) => ({
            label: exercise,
            data: sortedDates.map(date => exerciseData[exercise][date] || null),
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '20',
            fill: false,
            tension: 0.4,
            spanGaps: true
        }));

        return {
            labels: sortedDates,
            datasets: datasets
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LiftTracker();
});