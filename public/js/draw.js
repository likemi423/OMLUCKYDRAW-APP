document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const selPrize = document.getElementById('selPrize');
    const lblPrizeRemain = document.getElementById('lblPrizeRemain');
    const txtDrawCount = document.getElementById('txtDrawCount');
    const btnCountMinus = document.getElementById('btnCountMinus');
    const btnCountPlus = document.getElementById('btnCountPlus');
    const lblCandidates = document.getElementById('lblCandidates');
    const btnAction = document.getElementById('btnAction');
    const slotMachine = document.getElementById('slotMachine');
    const mainTitle = document.getElementById('mainTitle');

    const winnerModalOverlay = document.getElementById('winnerModalOverlay');
    const modalPrizeName = document.getElementById('modalPrizeName');
    const modalWinnerNames = document.getElementById('modalWinnerNames');
    const btnCloseModal = document.getElementById('btnCloseModal');

    // State
    let isRolling = false;
    let rollIntervalId = null;
    let currentData = null;
    let slotsConfig = []; // Array of DOM elements

    // Init Logic
    const loadDataAndRefreshUI = () => {
        currentData = AppData.load();

        // Populate Prizes
        const currentSelectedPrizeId = selPrize.value;
        selPrize.innerHTML = '';
        currentData.prizes.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.text = p.name;
            selPrize.appendChild(opt);
        });

        // Restore selection if forms exist
        if (currentSelectedPrizeId && currentData.prizes.find(p => p.id === currentSelectedPrizeId)) {
            selPrize.value = currentSelectedPrizeId;
        }

        updateLabels();
        renderSlots(parseInt(txtDrawCount.value));
    };

    const updateLabels = () => {
        if (!currentData) return;

        lblCandidates.innerText = currentData.participants.length;

        const selectedPrize = currentData.prizes.find(p => p.id === selPrize.value);
        if (selectedPrize) {
            const remaining = Math.max(0, parseInt(selectedPrize.count) - (selectedPrize.drawnCount || 0));
            lblPrizeRemain.innerText = remaining;

            // Limit draw count to max available combinations
            let maxDraw = Math.min(remaining, currentData.participants.length);
            if (maxDraw === 0) maxDraw = 1; // UI still shows 1 but disabled later

            let currentDraw = parseInt(txtDrawCount.value);
            if (currentDraw > maxDraw) {
                txtDrawCount.value = maxDraw;
            }
        }
    };

    // Slot rendering
    const renderSlots = (count) => {
        if (isRolling) return; // Do not resize while rolling
        slotMachine.innerHTML = '';
        slotsConfig = [];

        // Dynamic sizing logic based on container
        let w = 280, h = 120, fontSize = '2.5rem';
        if (count > 8) { w = 180; h = 80; fontSize = '1.5rem'; }
        else if (count > 4) { w = 220; h = 100; fontSize = '2rem'; }

        for (let i = 0; i < count; i++) {
            const slot = document.createElement('div');
            slot.className = 'slot-item';
            slot.style.width = w + 'px';
            slot.style.height = h + 'px';
            slot.style.fontSize = fontSize;

            const track = document.createElement('div');
            track.className = 'name-track';

            // Put a placeholder
            track.innerHTML = `<span>????</span>`;

            slot.appendChild(track);
            slotMachine.appendChild(slot);
            slotsConfig.push({ el: slot, track: track });
        }
    };

    // Interactions
    selPrize.addEventListener('change', () => {
        updateLabels();
        renderSlots(parseInt(txtDrawCount.value));
        const pName = selPrize.options[selPrize.selectedIndex].text;
        mainTitle.innerText = `抽取 ${pName}`;
    });

    btnCountMinus.addEventListener('click', () => {
        let val = parseInt(txtDrawCount.value);
        if (val > 1) {
            txtDrawCount.value = val - 1;
            renderSlots(val - 1);
        }
    });

    btnCountPlus.addEventListener('click', () => {
        const p = currentData.prizes.find(pz => pz.id === selPrize.value);
        const rem = Math.max(0, parseInt(p.count) - (p.drawnCount || 0));
        const maxData = currentData.participants.length;

        const limit = Math.min(rem, maxData, 50); // Hard UI limit of 50 at a time

        let val = parseInt(txtDrawCount.value);
        if (val < limit) {
            txtDrawCount.value = val + 1;
            renderSlots(val + 1);
        }
    });

    // Core Drawing Logic
    btnAction.addEventListener('click', () => {
        if (isRolling) {
            stopDraw();
        } else {
            startDraw();
        }
    });

    const startDraw = () => {
        const pool = currentData.participants;
        const prize = currentData.prizes.find(pz => pz.id === selPrize.value);
        const drawCount = parseInt(txtDrawCount.value);
        const remaining = Math.max(0, parseInt(prize.count) - (prize.drawnCount || 0));

        if (pool.length === 0) {
            return alert('候选人名单已为空！请前往后台导入名单。');
        }
        if (remaining <= 0) {
            return alert('该奖项名额已抽满！');
        }
        if (pool.length < drawCount) {
            return alert(`候选人数不足！仅剩 ${pool.length} 人。`);
        }

        isRolling = true;
        btnAction.innerText = '停止 [STOP]';
        btnAction.classList.remove('btn-primary');
        btnAction.classList.add('btn-danger');
        slotMachine.classList.add('rolling');

        // Pre-fill track with random names for illusion
        slotsConfig.forEach(slot => {
            let html = '';
            // 4 dummy items for smooth CSS loop
            for (let i = 0; i < 4; i++) {
                const randomUser = pool[Math.floor(Math.random() * pool.length)];
                html += `<span>${randomUser.name}</span>`;
            }
            slot.track.innerHTML = html;
        });

        // Fast random name swapping effect via JS
        rollIntervalId = setInterval(() => {
            slotsConfig.forEach(slot => {
                const spawns = slot.track.querySelectorAll('span');
                spawns.forEach(span => {
                    const r = pool[Math.floor(Math.random() * pool.length)];
                    span.innerText = r.name;
                });
            });
        }, 100);
    };

    const stopDraw = () => {
        isRolling = false;
        clearInterval(rollIntervalId);
        slotMachine.classList.remove('rolling');

        btnAction.innerText = '开始抽奖';
        btnAction.classList.remove('btn-danger');
        btnAction.classList.add('btn-primary');

        // Logic: Pick winners
        const pool = [...currentData.participants];
        const winners = [];
        const drawCount = parseInt(txtDrawCount.value);

        // Fisher-Yates shuffle
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        for (let i = 0; i < drawCount; i++) {
            winners.push(pool[i]);
        }

        // Extract winner IDs
        const winnerIds = winners.map(w => w.id);
        const savedWinners = AppData.recordDraw(selPrize.value, winnerIds);

        // Visual Effect for slots stopping (staggered)
        slotsConfig.forEach((slot, index) => {
            setTimeout(() => {
                slot.track.innerHTML = `<span>${winners[index].name}</span>`;
                slot.el.classList.add('winner');
            }, index * 200); // 200ms stagger stop
        });

        // Show Modal after last slot stops
        setTimeout(() => {
            showWinnerModal(currentData.prizes.find(pz => pz.id === selPrize.value).name, winners);
        }, slotsConfig.length * 200 + 800);

        // Refresh local data to match new state
        currentData = AppData.load();
        updateLabels();
    };

    const showWinnerModal = (prizeName, winners) => {
        modalPrizeName.innerText = `🎉 恭喜获得 ${prizeName} 🎉`;
        modalWinnerNames.innerHTML = winners.map(w => `<div>${w.name}</div>`).join('');
        winnerModalOverlay.classList.add('active');

        // Confetti Fireworks
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1001 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, {
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            }));
            confetti(Object.assign({}, defaults, {
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            }));
        }, 250);
    };

    btnCloseModal.addEventListener('click', () => {
        winnerModalOverlay.classList.remove('active');
        // Reset slot highlight
        slotsConfig.forEach(s => s.el.classList.remove('winner'));
        renderSlots(parseInt(txtDrawCount.value));
    });

    // Auto refresh across tabs
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && !isRolling) loadDataAndRefreshUI();
    });

    // Init
    loadDataAndRefreshUI();

    // Fallback if title lacks config
    if (selPrize.options.length > 0) {
        mainTitle.innerText = `抽取 ${selPrize.options[selPrize.selectedIndex].text}`;
    }
});
