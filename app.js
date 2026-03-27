document.addEventListener('DOMContentLoaded', () => {
    // Input Elements
    const budgetInput = document.getElementById('budget-input');
    const tokenInput = document.getElementById('token-input');
    const runBtn = document.getElementById('run-agent-btn');
    
    // UI Elements
    const statusBadge = document.getElementById('status-badge');
    const progressBar = document.getElementById('progress-bar');
    const currentTokensEl = document.getElementById('current-tokens');
    const currentCostEl = document.getElementById('current-cost');
    const currentSpeedEl = document.getElementById('current-speed');
    const alertBox = document.getElementById('alert-box');
    
    // Analysis Elements
    const placeholder = document.getElementById('analysis-placeholder');
    const resultsGrid = document.getElementById('analysis-results');
    const lastRunTime = document.getElementById('last-run-time');
    
    // Checkboxes
    const goalTime = document.getElementById('goal-time');
    const goalRoi = document.getElementById('goal-roi');
    const goalCost = document.getElementById('goal-cost');

    // Simulation constraints
    const CIRCUMFERENCE = 283; // 2 * pi * r for r=45
    let intervalId = null;
    let isRunning = false;

    // Formatting Helpers
    const formatNumber = num => num.toLocaleString('en-US');
    const formatCurrency = num => '$' + parseFloat(num).toFixed(2);
    
    // Main Run Function
    runBtn.addEventListener('click', () => {
        if (isRunning) return;
        
        let maxTokens = parseInt(tokenInput.value);
        let maxBudget = parseFloat(budgetInput.value);
        
        if (isNaN(maxTokens) || maxTokens <= 0) maxTokens = 100000;
        if (isNaN(maxBudget) || maxBudget <= 0) maxBudget = 50;
        
        // Reset UI
        isRunning = true;
        runBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Agent Running...';
        runBtn.classList.remove('btn-primary');
        runBtn.classList.add('btn-secondary');
        
        statusBadge.textContent = 'Running';
        statusBadge.className = 'badge badge-running';
        
        progressBar.style.stroke = 'var(--primary-neon)';
        alertBox.classList.add('hidden');
        
        placeholder.classList.add('hidden');
        resultsGrid.classList.add('hidden');
        
        // Simulation states
        let usedTokens = 0;
        let speed = Math.floor(maxTokens / 40); // Base speed
        
        // Logic loop
        intervalId = setInterval(() => {
            // Randomize speed fluctuation
            let currentSpeed = speed + Math.floor(Math.random() * (speed * 0.5)) - (speed * 0.25);
            usedTokens += Math.floor(currentSpeed);
            
            // Reached completion condition (either logic done or tokens maxed)
            let logicDoneTokens = maxTokens * (0.8 + Math.random() * 0.15); // Finishes between 80-95%
            
            // Budget constraint triggers early finish scenario randomly
            let randomFail = Math.random() > 0.95 && maxBudget < 20; // Slight chance to fail if low budget
            
            if (usedTokens >= logicDoneTokens || randomFail || usedTokens >= maxTokens) {
                usedTokens = Math.min(usedTokens, maxTokens);
                finishExecution(usedTokens, maxTokens, maxBudget);
                clearInterval(intervalId);
            }
            
            // Update UI
            let percentage = (usedTokens / maxTokens);
            let offset = CIRCUMFERENCE - (percentage * CIRCUMFERENCE);
            progressBar.style.strokeDashoffset = offset;
            
            currentTokensEl.textContent = formatNumber(usedTokens);
            currentSpeedEl.textContent = formatNumber(Math.floor(currentSpeed * 10)) + ' T/s'; // Mock fast reading
            
            let costPerToken = maxBudget / maxTokens;
            currentCostEl.textContent = formatCurrency(usedTokens * costPerToken);
            
            // Warning logic (above 85% capacity)
            if (percentage > 0.85 && alertBox.classList.contains('hidden')) {
                alertBox.classList.remove('hidden');
                progressBar.style.stroke = 'var(--danger)';
            }
            
        }, 100);
    });
    
    function finishExecution(finalTokens, maxTokens, budget) {
        isRunning = false;
        
        runBtn.innerHTML = '<i class="ph ph-play"></i> Run Agent Again';
        runBtn.classList.add('btn-primary');
        runBtn.classList.remove('btn-secondary');
        
        statusBadge.textContent = 'Completed';
        statusBadge.className = 'badge badge-done';
        
        currentSpeedEl.textContent = '0 T/s';
        
        // Update Timestamp
        const now = new Date();
        lastRunTime.textContent = `Last run: ${now.toLocaleTimeString()}`;
        
        // Generate Analysis Metrics Based on Checkboxes
        generateAnalysis(finalTokens, maxTokens, budget);
    }
    
    function generateAnalysis(tokens, maxTokens, budget) {
        const valRoi = document.getElementById('res-roi');
        const valTime = document.getElementById('res-time');
        const valCost = document.getElementById('res-cost');
        const suggestionPanel = document.getElementById('suggestion-panel');
        const suggestionText = document.getElementById('ai-suggestion-text');
        
        // Reveal Section Elements
        resultsGrid.classList.remove('hidden');
        suggestionPanel.className = 'suggestion-panel'; // reset classes
        
        // Math mocking based on user constraints
        let costSpent = (tokens / maxTokens) * budget;
        let isBudgetConstrained = budget < 30;
        
        // Calculate ROI heavily influenced by checkboxes and tokens
        let baseRoi = 15; // base 15%
        if (goalRoi.checked) baseRoi += 40;
        if (goalTime.checked) baseRoi += 20; 
        if (tokens >= maxTokens) baseRoi -= 30; // hit cap
        if (isBudgetConstrained) baseRoi -= 20; // low budget
        
        // Add randomness
        let finalRoi = Math.floor(baseRoi + (Math.random() * 30 - 15));
        
        // Time saved depending on tokens processed
        let timeSaved = (tokens / 50000) * (goalTime.checked ? 1.5 : 0.8);
        timeSaved = Math.max(0.5, timeSaved).toFixed(1);
        
        // Populate
        valRoi.textContent = finalRoi + '%';
        valTime.textContent = timeSaved + ' hrs';
        valCost.textContent = formatCurrency(costSpent);
        
        // Logic for AI Strategic Suggestion
        if (finalRoi <= 5) {
            valRoi.style.color = 'var(--danger)';
            suggestionPanel.classList.add('danger-accent');
            suggestionText.innerHTML = `<strong>Critical: ROI too low.</strong> The expected return is minimal. 建議：此專案流程自動化效益極低，建議直接「棄養專案」不再投入資源，或者需要全面重新檢視流程。`;
        } else if (finalRoi > 5 && finalRoi < 25) {
            valRoi.style.color = '#f59e0b';
            suggestionPanel.classList.add('warning-accent');
            suggestionText.innerHTML = `<strong>Optimization Needed:</strong> The return is suboptimal. 建議優化 Workflow：可以減少非必要的 AI 檢查節點，或是增加 Budget Limit 以完成更深度的資料處理。`;
        } else {
            valRoi.style.color = 'var(--success)';
            suggestionText.innerHTML = `<strong>Excellent Implementation!</strong> The AI Agent effectively streamlined the tasks. 專案執行順利，達到預期效益，系統已自動為您節省大量工時與成本。`;
        }
    }
});
