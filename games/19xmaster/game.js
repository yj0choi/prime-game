class MultiplicationGame {
    constructor() {
        this.score = 0;
        this.round = 1;
        this.maxRounds = 10;
        this.timeLeft = 10;
        this.timer = null;
        this.currentAnswer = 0;
        this.isProcessing = false;

        // Ranking Manager
        this.rankingManager = new RankingManager('math-game-19x-ranks', 'leaderboard-list', 'leaderboard-overlay');

        // DOM elements
        this.roundNumEl = document.getElementById('round-num');
        this.scoreValEl = document.getElementById('score-val');
        this.questionEl = document.getElementById('question');
        this.optionsEl = document.getElementById('options');
        this.timerBarEl = document.getElementById('timer-bar');
        this.feedbackOverlay = document.getElementById('feedback-overlay');
        this.feedbackText = document.getElementById('feedback-text');
        this.gameOverOverlay = document.getElementById('game-over-overlay');
        this.finalScoreEl = document.getElementById('final-score');
        this.rankInputArea = document.getElementById('rank-input-area');
        this.leaderboardInGameView = document.getElementById('leaderboard-view-in-game');
        this.normalEndView = document.getElementById('normal-end-view');
        this.playerNameInput = document.getElementById('player-name');
        this.saveRankBtn = document.getElementById('save-rank');
        this.rankViewBtn = document.getElementById('rank-view-btn');
        this.closeRankBtn = document.getElementById('close-rank-btn');

        this.init();
    }

    init() {
        this.saveRankBtn.onclick = () => this.saveRank();
        this.playerNameInput.onkeypress = (e) => {
            if (e.key === 'Enter') this.saveRank();
        };
        this.rankViewBtn.onclick = () => this.rankingManager.show();
        this.closeRankBtn.onclick = () => this.rankingManager.hide();
        this.startRound();
    }

    startRound() {
        if (this.round > this.maxRounds) {
            this.endGame();
            return;
        }

        this.isProcessing = false;
        this.roundNumEl.textContent = this.round;
        this.generateQuestion();
        this.startTimer();
    }

    generateQuestion() {
        const a = Math.floor(Math.random() * 9) + 11; // 11-19
        let b;
        
        if (this.round <= 4) {
            // 1~4 라운드: b는 1자리 수 (3~9, 2 제외)
            do {
                b = Math.floor(Math.random() * 7) + 3; // 3-9
            } while (b === 2); // 2는 이미 제외 범위지만 명시적 처리
        } else {
            // 5~10 라운드: b는 2자리 수 (11~19, 10 제외)
            do {
                b = Math.floor(Math.random() * 9) + 11; // 11-19
            } while (b === 10); // 10은 이미 제외 범위지만 명시적 처리
        }

        this.currentAnswer = a * b;
        this.questionEl.textContent = `${a} x ${b} =`;
        
        const options = this.generateOptions(this.currentAnswer);
        this.optionsEl.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.onclick = () => this.handleSelection(opt, btn);
            this.optionsEl.appendChild(btn);
        });
    }

    generateOptions(correct) {
        const options = [correct];
        const lastDigit = correct % 10;

        while (options.length < 3) {
            const diff = (Math.floor(Math.random() * 11) - 5) * 10; // -50, -40 ... +50
            if (diff === 0) continue;
            
            const wrong = correct + diff;
            if (wrong > 0 && !options.includes(wrong) && (wrong % 10 === lastDigit)) {
                options.push(wrong);
            }
        }
        return this.shuffle(options);
    }

    shuffle(array) {
        return array.sort(() => Math.random() - 0.5);
    }

    startTimer() {
        this.timeLeft = 10;
        this.updateTimerBar();
        
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.timeLeft -= 0.1;
            this.updateTimerBar();

            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.handleTimeout();
            }
        }, 100);
    }

    updateTimerBar() {
        const percentage = (this.timeLeft / 10) * 100;
        this.timerBarEl.style.width = `${percentage}%`;
        
        if (this.timeLeft <= 3) {
            this.timerBarEl.classList.add('warning');
        } else {
            this.timerBarEl.classList.remove('warning');
        }
    }

    handleSelection(selected, btn) {
        if (this.isProcessing) return;
        this.isProcessing = true;
        clearInterval(this.timer);

        const isCorrect = selected === this.currentAnswer;
        if (isCorrect) {
            const timeBonus = Math.floor(this.timeLeft) * 10;
            this.score += (this.currentAnswer + timeBonus);
            this.scoreValEl.textContent = this.score;
            btn.classList.add('correct');
            this.showFeedback(`EXCELLENT! +${timeBonus} Bonus`, true);
        } else {
            btn.classList.add('wrong');
            Array.from(this.optionsEl.children).forEach(b => {
                if (parseInt(b.textContent) === this.currentAnswer) {
                    b.classList.add('correct');
                }
            });
            this.showFeedback('WRONG...', false);
        }

        setTimeout(() => {
            this.round++;
            this.hideFeedback();
            this.startRound();
        }, 1000);
    }

    handleTimeout() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        
        this.showFeedback('TIME OUT!', false);
        Array.from(this.optionsEl.children).forEach(b => {
            if (parseInt(b.textContent) === this.currentAnswer) {
                b.classList.add('correct');
            }
        });

        setTimeout(() => {
            this.round++;
            this.hideFeedback();
            this.startRound();
        }, 1000);
    }

    showFeedback(text, isSuccess) {
        this.feedbackText.textContent = text;
        this.feedbackText.className = isSuccess ? 'success-text' : 'error-text';
        this.feedbackOverlay.classList.remove('hidden');
        this.feedbackOverlay.classList.add('fade-in');
    }

    hideFeedback() {
        this.feedbackOverlay.classList.add('hidden');
        this.feedbackOverlay.classList.remove('fade-in');
    }

    endGame() {
        this.finalScoreEl.textContent = this.score;
        this.gameOverOverlay.classList.remove('hidden');
        this.gameOverOverlay.classList.add('fade-in');

        const isTop5 = this.rankingManager.checkTop5(this.score);

        if (isTop5) {
            this.rankInputArea.classList.remove('hidden');
        } else {
            this.normalEndView.classList.remove('hidden');
            this.leaderboardInGameView.classList.remove('hidden');
        }
    }

    saveRank() {
        const name = this.playerNameInput.value.trim() || '익명';
        this.rankingManager.save(name, this.score);
        
        this.rankInputArea.classList.add('hidden');
        this.leaderboardInGameView.classList.remove('hidden');
        this.rankingManager.show();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MultiplicationGame();
});
