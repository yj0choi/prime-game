class PrimeGame {
    constructor() {
        this.totalRounds = 10;
        this.round = 1;
        this.score = 0;
        this.cardPool = [];
        this.selectedCards = [];
        this.availableCards = [];
        this.rankings = this.loadRankings();

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

        // New Overlays & Controls
        this.rankViewBtn = document.getElementById('rank-view-btn');
        this.rankEntryOverlay = document.getElementById('rank-entry-overlay');
        this.leaderboardOverlay = document.getElementById('leaderboard-overlay');
        this.finalScoreEl = document.getElementById('final-score');
        this.newRecordInput = document.getElementById('new-record-input');
        this.playerNameInput = document.getElementById('player-name');
        this.saveRankBtn = document.getElementById('save-rank-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.closeRankBtn = document.getElementById('close-rank-btn');
        this.rankList = document.getElementById('rank-list');
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
        this.rankViewBtn.addEventListener('click', () => this.showLeaderboard());
        this.closeRankBtn.addEventListener('click', () => this.leaderboardOverlay.classList.add('hidden'));
        this.restartBtn.addEventListener('click', () => location.reload());
        this.mainRestartBtn.addEventListener('click', () => this.restartGame());
        this.saveRankBtn.addEventListener('click', () => this.saveCurrentRank());
        this.startLevel();
    }

    loadRankings() {
        const saved = localStorage.getItem('primeMakerRankings');
        return saved ? JSON.parse(saved) : [];
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

    generateValidCards() {
        // 난이도 조절: 1~4라운드 2개, 5~10라운드 3개 고정
        const count = this.round <= 4 ? 2 : 3;
        
        const badNumbers = [0, 4, 6, 8, 9];
        const goodNumbers = [1, 2, 3, 5, 7];
        
        // 15% 확률로 소수를 절대 만들 수 없는 카드 세트 생성 시도
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
                if (!hasPrime) return cards; // 소수 생성이 안 되는 케이스 성공
            } else {
                if (hasPrime) return cards; // 소수 생성이 되는 케이스 성공
            }
            attempts++;
        }
        return [1, 0, 1]; // 안전 장치
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
        this.nextBtn.textContent = this.round >= this.totalRounds ? "최종 결과 보기" : "다음 라운드";
        document.getElementById('app').classList.add('shake');
        setTimeout(() => document.getElementById('app').classList.remove('shake'), 500);
    }

    handleNoPrimeClick() {
        const hasPrime = this.hasPossibleTwoDigitPrime(this.cardPool);
        
        this.stopTimer();
        this.overlay.classList.remove('hidden');
        
        if (!hasPrime) {
            this.statusTitle.textContent = "GENIUS!";
            this.statusTitle.className = "success-text";
            this.statusDesc.textContent = "현재 카드로 소수를 만들 수 없음을 간파하셨습니다! (+100점)";
            this.score += 100;
        } else {
            this.statusTitle.textContent = "FAILED...";
            this.statusTitle.className = "error-text";
            this.statusDesc.textContent = "소수를 만들 수 있는 조합이 존재합니다.";
            document.getElementById('app').classList.add('shake');
            setTimeout(() => document.getElementById('app').classList.remove('shake'), 500);
        }
        this.nextBtn.textContent = this.round >= this.totalRounds ? "최종 결과 보기" : "다음 라운드";
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
        // 제출 버튼 활성화 조건: 선택된 카드로 구성된 숫자가 10 이상이어야 함
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

        this.stopTimer();
        this.overlay.classList.remove('hidden');
        if (isPrime) {
            this.statusTitle.textContent = "SUCCESS!";
            this.statusTitle.className = "success-text";
            this.statusDesc.textContent = `${finalNum}은(는) 소수가 맞습니다!`;
            // 점수 시스템 개편: 소수 값 자체를 누적
            this.score += finalNum;
        } else {
            this.statusTitle.textContent = "FAILED...";
            this.statusTitle.className = "error-text";
            this.statusDesc.textContent = `${finalNum}은(는) 소수가 아닙니다.`;
            document.getElementById('app').classList.add('shake');
            setTimeout(() => document.getElementById('app').classList.remove('shake'), 500);
        }
        this.nextBtn.textContent = this.round >= this.totalRounds ? "최종 결과 보기" : "다음 라운드";
    }

    nextRound() {
        this.nextBtn.disabled = true; // 버튼 비활성화
        this.overlay.classList.add('hidden');
        if (this.round >= this.totalRounds) {
            // 10라운드 종료 시 300ms 지연 후 endGame 호출 (더블 클릭 방지)
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


    deleteRank(index) {
        if (confirm("이 기록을 삭제하시겠습니까?")) {
            this.rankings.splice(index, 1);
            localStorage.setItem('primeMakerRankings', JSON.stringify(this.rankings));
            this.showLeaderboard();
        }
    }

    endGame() {
        this.rankEntryOverlay.classList.remove('hidden');
        this.finalScoreEl.textContent = this.score;
        
        // 랭킹 진입 확인 (Top 5)
        const isHighScore = this.rankings.length < 5 || this.score > this.rankings[this.rankings.length - 1].score;
        
        if (isHighScore) {
            this.newRecordInput.classList.remove('hidden');
            // 이름 입력창에 자동 포커스
            setTimeout(() => this.playerNameInput.focus(), 100);
        } else {
            this.newRecordInput.classList.add('hidden');
        }
    }

    saveCurrentRank() {
        const name = this.playerNameInput.value.trim() || "무명 용사";
        const newRank = { name, score: this.score, date: new Date().toLocaleDateString() };
        
        this.rankings.push(newRank);
        this.rankings.sort((a, b) => b.score - a.score);
        this.rankings = this.rankings.slice(0, 5); // TOP 5
        
        localStorage.setItem('primeMakerRankings', JSON.stringify(this.rankings));
        this.showLeaderboard();
        this.rankEntryOverlay.classList.add('hidden');
    }

    showLeaderboard() {
        this.rankList.innerHTML = '';
        if (this.rankings.length === 0) {
            this.rankList.innerHTML = '<li>등록된 기록이 없습니다.</li>';
        } else {
            this.rankings.forEach((rank, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="rank-info">
                        <span class="rank-num">${index + 1}위</span>
                        <span class="player-name">${rank.name}</span>
                        <span class="player-score">${rank.score}점</span>
                    </div>
                    <button class="delete-rank-item" title="기록 삭제">&times;</button>
                `;
                // X 버튼 클릭 이벤트 연결
                li.querySelector('.delete-rank-item').onclick = (e) => {
                    e.stopPropagation();
                    this.deleteRank(index);
                };
                this.rankList.appendChild(li);
            });
        }
        this.leaderboardOverlay.classList.remove('hidden');
    }
}

window.onload = () => new PrimeGame();
