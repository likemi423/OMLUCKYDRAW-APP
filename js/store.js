const STORAGE_KEY = 'luckydraw_data_v1';

const defaultData = {
    participants: [],
    prizes: [
        { id: "p1", name: "一等奖", count: 1, drawnCount: 0 },
        { id: "p2", name: "二等奖", count: 2, drawnCount: 0 },
        { id: "p3", name: "三等奖", count: 5, drawnCount: 0 }
    ],
    winners: []
};

// Data Layer
const AppData = {
    load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) return JSON.parse(data);
        } catch (e) {
            console.error("Failed to load data", e);
        }
        this.save(defaultData);
        return JSON.parse(JSON.stringify(defaultData));
    },

    save(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        // Dispatch event for cross-tab communication
        window.dispatchEvent(new Event('storageUpdated'));
    },

    addParticipants(namesStr) {
        const data = this.load();
        const names = namesStr.split(/[\n,，]+/).map(n => n.trim()).filter(n => n);
        const startId = Date.now();

        const newParticipants = names.map((name, index) => ({
            id: `usr_${startId}_${index}`,
            name
        }));

        data.participants.push(...newParticipants);
        this.save(data);
        return newParticipants.length;
    },

    clearParticipants() {
        const data = this.load();
        data.participants = [];
        this.save(data);
    },

    updatePrizes(prizes) {
        const data = this.load();
        // Preserve drawn counts if prize ID matches
        data.prizes = prizes.map(p => {
            const existing = data.prizes.find(ep => ep.id === p.id);
            return {
                ...p,
                drawnCount: existing ? existing.drawnCount : 0
            };
        });
        this.save(data);
    },

    recordDraw(prizeId, winnerIds) {
        const data = this.load();
        const prize = data.prizes.find(p => p.id === prizeId);
        if (!prize) return false;

        const drawnParticipants = data.participants.filter(p => winnerIds.includes(p.id));
        const newWinners = drawnParticipants.map(w => ({
            ...w,
            prize: { id: prize.id, name: prize.name },
            timestamp: new Date().toISOString()
        }));

        prize.drawnCount += winnerIds.length;
        data.winners.push(...newWinners);
        data.participants = data.participants.filter(p => !winnerIds.includes(p.id));

        this.save(data);
        return newWinners;
    },

    resetHistory() {
        const data = this.load();
        // Move winners back to participants
        const returnedParticipants = data.winners.map(w => ({ id: w.id, name: w.name }));
        data.participants.push(...returnedParticipants);
        data.winners = [];
        data.prizes.forEach(p => p.drawnCount = 0);
        this.save(data);
    },

    hardReset() {
        localStorage.removeItem(STORAGE_KEY);
        this.load(); // Reloads default
    }
};
