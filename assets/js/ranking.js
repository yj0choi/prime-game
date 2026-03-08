class RankingManager {
    constructor(storageKey, listElementId, overlayElementId) {
        this.storageKey = storageKey;
        this.listEl = document.getElementById(listElementId);
        this.overlayEl = document.getElementById(overlayElementId);
    }

    load() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : [];
    }

    save(name, score) {
        let ranks = this.load();
        const date = new Date().toLocaleDateString('ko-KR');
        ranks.push({ name: name || '무명 용사', score, date });
        ranks.sort((a, b) => b.score - a.score);
        ranks = ranks.slice(0, 5);
        localStorage.setItem(this.storageKey, JSON.stringify(ranks));
        return ranks;
    }

    delete(index) {
        if (confirm("이 기록을 삭제하시겠습니까?")) {
            let ranks = this.load();
            ranks.splice(index, 1);
            localStorage.setItem(this.storageKey, JSON.stringify(ranks));
            this.render();
            return true;
        }
        return false;
    }

    checkTop5(score) {
        const ranks = this.load();
        return ranks.length < 5 || score > ranks[ranks.length - 1].score;
    }

    render() {
        if (!this.listEl) return;
        
        const ranks = this.load();
        this.listEl.innerHTML = '';
        
        if (ranks.length === 0) {
            this.listEl.innerHTML = '<li style="justify-content: center; color: var(--text-sub);">등록된 기록이 없습니다.</li>';
        } else {
            ranks.forEach((rank, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="rank-info">
                        <span class="rank-num">${index + 1}위</span>
                        <span class="rank-name">${rank.name}</span>
                        <span class="rank-score">${rank.score}점</span>
                    </div>
                    <button class="delete-rank-item" title="삭제">×</button>
                `;
                li.querySelector('.delete-rank-item').onclick = (e) => {
                    e.stopPropagation();
                    this.delete(index);
                };
                this.listEl.appendChild(li);
            });
        }
    }

    show() {
        this.render();
        if (this.overlayEl) {
            this.overlayEl.classList.remove('hidden');
        }
    }

    hide() {
        if (this.overlayEl) {
            this.overlayEl.classList.add('hidden');
        }
    }
}
