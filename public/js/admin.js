document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const statTotalParticipants = document.getElementById('statTotalParticipants');
    const statTotalPrizes = document.getElementById('statTotalPrizes');
    const statDrawnPrizes = document.getElementById('statDrawnPrizes');

    const txtParticipantsInput = document.getElementById('txtParticipantsInput');
    const btnAddParticipants = document.getElementById('btnAddParticipants');
    const btnClearParticipants = document.getElementById('btnClearParticipants');

    const prizeListContainer = document.getElementById('prizeListContainer');
    const btnAddPrizeRow = document.getElementById('btnAddPrizeRow');
    const btnSavePrizes = document.getElementById('btnSavePrizes');

    const historyTableBody = document.getElementById('historyTableBody');
    const emptyHistoryState = document.getElementById('emptyHistoryState');
    const btnResetHistory = document.getElementById('btnResetHistory');
    const btnHardReset = document.getElementById('btnHardReset');

    // Render logic
    const fetchAndRender = () => {
        const data = AppData.load();

        // 1. Update stats
        statTotalParticipants.innerText = data.participants.length;
        const prizeSum = data.prizes.reduce((sum, p) => sum + parseInt(p.count || 0), 0);
        statTotalPrizes.innerText = prizeSum;
        const drawnSum = data.prizes.reduce((sum, p) => sum + parseInt(p.drawnCount || 0), 0);
        statDrawnPrizes.innerText = drawnSum;

        // 2. Render Prizes form
        prizeListContainer.innerHTML = '';
        data.prizes.forEach((prize, idx) => {
            const row = document.createElement('div');
            row.className = 'flex gap-4 items-center';
            row.innerHTML = `
                <input type="text" class="prize-name" value="${prize.name}" placeholder="奖项名称 (如一等奖)" style="flex: 2">
                <input type="number" class="prize-count" value="${prize.count}" placeholder="名额" min="1" style="flex: 1">
                <div style="flex: 1; color: var(--text-muted); font-size: 0.9em">已抽: ${prize.drawnCount || 0}</div>
                <button class="btn btn-outline btn-remove-prize" data-index="${idx}">❌</button>
            `;
            prizeListContainer.appendChild(row);
        });

        // 3. Render History Table
        historyTableBody.innerHTML = '';
        if (data.winners.length === 0) {
            emptyHistoryState.style.display = 'block';
            historyTableBody.parentElement.style.display = 'none';
        } else {
            emptyHistoryState.style.display = 'none';
            historyTableBody.parentElement.style.display = 'table';

            // Sort winners reverse chronologically
            const sortedWinners = [...data.winners].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            sortedWinners.forEach(winner => {
                const tr = document.createElement('tr');
                const timeStr = new Date(winner.timestamp).toLocaleTimeString();
                tr.innerHTML = `
                    <td style="color: var(--text-muted)">${timeStr}</td>
                    <td><span class="badge success">${winner.prize.name}</span></td>
                    <td style="font-weight: 600; color: #fff">${winner.name}</td>
                `;
                historyTableBody.appendChild(tr);
            });
        }
    };

    // Actions
    btnAddParticipants.addEventListener('click', () => {
        const val = txtParticipantsInput.value;
        if (!val.trim()) return alert('请输入有效名单！');
        const count = AppData.addParticipants(val);
        txtParticipantsInput.value = '';
        fetchAndRender();
        alert(`成功导入 ${count} 位候选人！`);
    });

    btnClearParticipants.addEventListener('click', () => {
        if (confirm('确定要清空所有尚未中奖的候选人名单吗？这不会影响已中奖的历史记录。')) {
            AppData.clearParticipants();
            fetchAndRender();
        }
    });

    btnAddPrizeRow.addEventListener('click', () => {
        const tempId = `p_new_${Date.now()}`;
        const prizes = getPrizesFromDOM();
        prizes.push({ id: tempId, name: '新奖项', count: 1 });
        AppData.updatePrizes(prizes);
        fetchAndRender();
    });

    prizeListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-prize')) {
            const idx = parseInt(e.target.getAttribute('data-index'));
            const prizes = getPrizesFromDOM();
            prizes.splice(idx, 1);
            AppData.updatePrizes(prizes);
            fetchAndRender();
        }
    });

    btnSavePrizes.addEventListener('click', () => {
        const prizes = getPrizesFromDOM();
        AppData.updatePrizes(prizes);
        fetchAndRender();
        alert('奖项设置已保存！');
    });

    btnResetHistory.addEventListener('click', () => {
        if (confirm('重要！此操作将【清空中奖记录】并【将所有中奖者重新放回候选人池】，确定执行吗？')) {
            AppData.resetHistory();
            fetchAndRender();
        }
    });

    btnHardReset.addEventListener('click', () => {
        if (confirm('危险操作！这会彻底清除所有名单、历史记录和自定义奖项，恢复到初始默认状态。不可逆！确定彻底重置吗？')) {
            AppData.hardReset();
            fetchAndRender();
        }
    });

    function getPrizesFromDOM() {
        const data = AppData.load();
        const rows = document.querySelectorAll('#prizeListContainer > div');
        const newPrizes = [];
        rows.forEach((row, i) => {
            const name = row.querySelector('.prize-name').value.trim();
            const count = parseInt(row.querySelector('.prize-count').value.trim()) || 1;
            // Best effort to preserve IDs
            const existingId = (data.prizes[i] && data.prizes[i].id) ? data.prizes[i].id : `p_${Date.now()}_${i}`;
            newPrizes.push({ id: existingId, name, count });
        });
        return newPrizes;
    }

    // Auto refresh when LocalStorage changes in another tab
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) fetchAndRender();
    });

    // Internal event if stored in same tab
    window.addEventListener('storageUpdated', () => {
        fetchAndRender();
    });

    // Initial render
    fetchAndRender();
});
