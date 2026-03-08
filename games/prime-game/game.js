class PrimeGame {
    constructor() {
        this.totalRounds = 10;
        this.round = 1;
        this.score = 0;
        this.cardPool = [];
        this.selectedCards = [];
        this.availableCards = [];

        // Ranking Manager
        this.rankingManager = new RankingManager('primeMakerRankings', 'rank-list', 'leaderboard-overlay');

        // DOM Elements
        this.roundEl = document.getElementById('round-value');
        this.scoreEl = document.getElementById('score-value');
        this.poolArea = document.getElementById('card-pool');
        this.selectedArea = document.getElementById('selected-cards');
        this.placeholder = document.getElementById('placeholder');
        this.submitBtn = document.getElementById('submit-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.overlay = document.getElementById('message-overlay');
        this.nextBtn = document.getElementById('next-btn');
        this.statusTitle = document.getElementById('status-title');
        this.statusDesc = document.getElementById('status-desc');

        // Overlays & Controls
        this.rankViewBtn = document.getElementById('rank-view-btn');
        this.rankEntryOverlay = document.getElementById('rank-entry-overlay');
        this.finalScoreEl = document.getElementById('final-score');
        this.newRecordInput = document.getElementById('new-record-input');
        this.playerNameInput = document.getElementById('player-name');
        this.saveRankBtn = document.getElementById('save-rank-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.closeRankBtn = document.getElementById('close-rank-btn');
        this.mainRestartBtn = document.getElementById('main-restart-btn');

        // Timer State
        this.timeLeft = 10;
        this.timerInterval = null;
        this.timerEl = document.getElementById('timer-value');
        this.noPrimeBtn = document.getElementById('no-prime-btn');

        this.init();
    }

    init() {
        this.submitBtn.addEventListener('click', () => this.checkResult());
        this.resetBtn.addEventListener('click', () => this.resetSelection());
        this.noPrimeBtn.addEventListener('click', () => this.handleNoPrimeClick());
        this.nextBtn.addEventListener('click', () => this.nextRound());
        this.rankViewBtn.addEventListener('click', () => this.rankingManager.show());
        this.closeRankBtn.addEventListener('click', () => this.rankingManager.hide());
        this.restartBtn.addEventListener('click', () => location.reload());
        this.mainRestartBtn.addEventListener('click', () => this.restartGame());
        this.saveRankBtn.addEventListener('click', () => this.saveCurrentRank());
        this.startLevel();
    }

    isPrime(num) {
        if (num <= 1) return false;
        if (num <= 3) return true;
        if (num % 2 === 0 || num % 3 === 0) return false;
        for (let i = 5; i * i <= num; i += 6) {
            if (num % i === 0 || num % (i + 2) === 0) return false;
        }
        return true;
    }

    getSmallestFactor(num) {
        if (num % 2 === 0) return 2;
        if (num % 3 === 0) return 3;
        for (let i = 5; i * i <= num; i += 6) {
            if (num % i === 0) return i;
            if (num % (i + 2) === 0) return i + 2;
        }
        return num;
    }

    generateValidCards() {
        const count = this.round <= 4 ? 2 : 3;
        const badNumbers = [0, 4, 6, 8, 9];
        const goodNumbers = [1, 2, 3, 5, 7];
        const allowImpossible = Math.random() < 0.15;

        let attempts = 0;
        while (attempts < 200) {
            const cards = [];
            for (let i = 0; i < count; i++) {
                const badProb = Math.min(0.2 + this.round * 0.05, 0.7);
                if (Math.random() < badProb) {
                    cards.push(badNumbers[Math.floor(Math.random() * badNumbers.length)]);
                } else {
                    cards.push(goodNumbers[Math.floor(Math.random() * goodNumbers.length)]);
                }
            }

            const hasPrime = this.hasPossibleTwoDigitPrime(cards);
            if (allowImpossible) {
                if (!hasPrime) return cards;
            } else {
                if (hasPrime) return cards;
            }
            attempts++;
        }
        return [1, 0, 1];
    }

    hasPossibleTwoDigitPrime(cards) {
        let found = false;
        const permute = (arr, m = "") => {
            if (found) return;
            const val = parseInt(m);
            if (m.length >= 2 && val >= 10 && this.isPrime(val)) {
                found = true;
                return;
            }
            if (arr.length === 0) return;

            for (let i = 0; i < arr.length; i++) {
                const curr = arr.slice();
                const next = curr.splice(i, 1);
                permute(curr, m + next);
            }
        };
        permute(cards);
        return found;
    }

    startLevel() {
        this.cardPool = this.generateValidCards();
        this.availableCards = [...this.cardPool];
        this.selectedCards = [];
        this.startTimer();
        this.render();
    }

    startTimer() {
        this.stopTimer();
        this.timeLeft = 10;
        this.updateTimerUI();
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerUI();
            if (this.timeLeft <= 0) {
                this.handleTimeOut();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerUI() {
        this.timerEl.textContent = this.timeLeft;
        this.timerEl.classList.toggle('warning', this.timeLeft <= 3);
    }

    handleTimeOut() {
        this.stopTimer();
        this.statusTitle.textContent = "TIME OVER!";
        this.statusTitle.className = "error-text";
        this.statusDesc.textContent = "제한 시간이 초과되었습니다.";
        this.overlay.classList.remove('hidden');
        document.getElementById('app').classList.add('shake');
        setTimeout(() => document.getElementById('app').classList.remove('shake'), 500);
        setTimeout(() => this.nextRound(), 1000);
    }

    handleNoPrimeClick() {
        const hasPrime = this.hasPossibleTwoDigitPrime(this.cardPool);
        const timeBonus = Math.floor(this.timeLeft) * 10;
        
        this.stopTimer();
        this.overlay.classList.remove('hidden');
        
        if (!hasPrime) {
            this.statusTitle.textContent = "GENIUS!";
            this.statusTitle.className = "success-text";
            this.statusDesc.textContent = `소수를 만들 수 없음을 간파하셨습니다! (+100 +${timeBonus} Bonus)`;
            this.score += (100 + timeBonus);
        } else {
            this.statusTitle.textContent = "FAILED...";
            this.statusTitle.className = "error-text";
            this.statusDesc.textContent = "소수를 만들 수 있는 조합이 존재합니다.";
            document.getElementById('app').classList.add('shake');
            setTimeout(() => document.getElementById('app').classList.remove('shake'), 500);
        }
        setTimeout(() => this.nextRound(), 1000);
    }

    render() {
        this.roundEl.textContent = `${this.round} / ${this.totalRounds}`;
        this.scoreEl.textContent = this.score;

        this.poolArea.innerHTML = '';
        this.availableCards.forEach((num, index) => {
            if (num !== null) {
                const card = document.createElement('div');
                card.className = 'card';
                card.textContent = num;
                card.onclick = () => this.selectCard(index);
                this.poolArea.appendChild(card);
            }
        });

        this.selectedArea.innerHTML = '';
        this.selectedCards.forEach((num, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.textContent = num;
            this.selectedArea.appendChild(card);
        });

        this.placeholder.classList.toggle('hidden', this.selectedCards.length > 0);
        const currentVal = parseInt(this.selectedCards.join('')) || 0;
        this.submitBtn.disabled = this.selectedCards.length === 0 || currentVal < 10;
    }

    selectCard(index) {
        const num = this.availableCards[index];
        if (num === null) return;
        this.selectedCards.push(num);
        this.availableCards[index] = null;
        this.render();
    }

    resetSelection() {
        this.availableCards = [...this.cardPool];
        this.selectedCards = [];
        this.render();
    }

    checkResult() {
        const finalNum = parseInt(this.selectedCards.join(''));
        const isPrime = this.isPrime(finalNum);
        const timeBonus = Math.floor(this.timeLeft) * 10;

        this.stopTimer();
        this.overlay.classList.remove('hidden');
        if (isPrime) {
            this.statusTitle.textContent = "SUCCESS!";
            this.statusTitle.className = "success-text";
            this.statusDesc.textContent = `${finalNum}은(는) 소수가 맞습니다! (+${timeBonus} Bonus)`;
            this.score += (finalNum + timeBonus);
        } else {
            this.statusTitle.textContent = "FAILED...";
            this.statusTitle.className = "error-text";
            const factor = this.getSmallestFactor(finalNum);
            const other = finalNum / factor;
            this.statusDesc.innerHTML = `${finalNum}은(는) 소수가 아닙니다.<br><span style="display:block; margin-top:10px; opacity:0.8; font-size:0.9em;">(${factor} × ${other} = ${finalNum})</span>`;
            document.getElementById('app').classList.add('shake');
            setTimeout(() => document.getElementById('app').classList.remove('shake'), 500);
        }
        setTimeout(() => this.nextRound(), 1000);
    }

    nextRound() {
        this.nextBtn.disabled = true;
        this.overlay.classList.add('hidden');
        if (this.round >= this.totalRounds) {
            setTimeout(() => {
                this.endGame();
                this.nextBtn.disabled = false;
            }, 300);
        } else {
            this.round++;
            this.startLevel();
            this.nextBtn.disabled = false;
        }
    }

    restartGame() {
        if (this.round > 1 && !confirm("현재 진행 중인 게임이 초기화됩니다. 다시 시작하시겠습니까?")) {
            return;
        }
        this.round = 1;
        this.score = 0;
        this.startLevel();
    }

    endGame() {
        this.rankEntryOverlay.classList.remove('hidden');
        this.finalScoreEl.textContent = this.score;
        
        const isHighScore = this.rankingManager.checkTop5(this.score);
        
        if (isHighScore) {
            this.newRecordInput.classList.remove('hidden');
            setTimeout(() => this.playerNameInput.focus(), 100);
        } else {
            this.newRecordInput.classList.add('hidden');
        }
    }

    saveCurrentRank() {
        const name = this.playerNameInput.value.trim() || "무명 용사";
        this.rankingManager.save(name, this.score);
        this.rankingManager.show();
        this.rankEntryOverlay.classList.add('hidden');
    }
}

window.onload = () => new PrimeGame();
