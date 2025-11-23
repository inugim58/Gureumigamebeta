// 1. 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 💡 [참고] 캔버스 크기를 명시적으로 설정하여 플레이어 초기 위치 오류 방지
canvas.width = 800;
canvas.height = 600;

// 2. 이미지 에셋 로드
const playerImages = {
    front: new Image(),
    back: new Image(),
    left: new Image(),
    right: new Image()
};

// [중요] 이미지 파일명은 프로젝트 구조에 맞게 'images/' 폴더 내의 파일명과 일치해야 합니다.
// 💡 [참고] 현재 파일명은 'player_front.png' 등으로 되어 있습니다. 실제 파일명과 일치해야 합니다.
playerImages.front.src = 'images/player_front.png'; 
playerImages.back.src = 'images/player_back.png';
playerImages.left.src = 'images/player_left.png';
playerImages.right.src = 'images/player_right.png';

const backgroundImage = new Image();
backgroundImage.src = 'images/background.png'; 

const appleImage = new Image(); 
appleImage.src = 'images/apple.png'; 

// TV 이미지 객체
const tvImage = new Image();
tvImage.src = 'images/tv.png'; 


// 3. 플레이어 속성 정의
let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 60,                
    height: 60,               
    speed: 5,
    dx: 0,
    dy: 0,
    direction: 'front'        
};

// 4. TV 크기 조절 변수 (이 값을 조절하여 TV 크기를 설정하세요)
const TV_WIDTH = 100; 
const TV_HEIGHT = 100;

// TV 위치 및 상호작용 상태 정의
let tv = {
    x: 175,   // TV 중심 X 좌표
    y: 200,   // TV 중심 Y 좌표
    width: TV_WIDTH, 
    height: TV_HEIGHT 
};

// 5. 사과(아이템) 관련 상태 정의 
const APPLE_RADIUS = 12; 
const INITIAL_APPLE_COUNT = 5; 
let apples = []; 

// 6. 점수 및 타이머 상태 정의 
let score = 0; 
const MAX_GAME_TIME = 30; // 30초
let gameTime = MAX_GAME_TIME * 60; // 프레임 단위로 저장 (30 * 60FPS)

// 💡 [추가] 성공 조건 정의
const SUCCESS_SCORE = 30; 

// 7. 상호작용 메시지를 위한 상태 변수
let interactionMessage = {
    text: "",
    visible: false,
    timer: 0 
};

// 8. 게임 상태 변수
let gameStatus = 'TITLE'; // 'TITLE', 'PLAYING', 'GAME_OVER', 'SUCCESS'

// 9. 키보드 상태 객체
let keys = {};

// 💡 [추가] 모바일 버튼 상태
let mobileKeys = {
    'ArrowUp': false,
    'ArrowDown': false,
    'ArrowLeft': false,
    'ArrowRight': false,
    'Space': false
};

// =========================================================
// 10. 입력 처리 (이벤트 리스너)
// =========================================================

// 키보드 입력 처리
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// 💡 [추가] 모바일 터치 입력 처리
const handleTouchControls = () => {
    const buttons = document.querySelectorAll('.dpad-button, #action-button');

    buttons.forEach(button => {
        const key = button.getAttribute('data-key');
        
        const startHandler = (e) => {
            e.preventDefault(); 
            mobileKeys[key] = true;
            // Space 키는 누른 순간 checkInteraction()을 실행해야 하므로 여기서 한 번 실행
            if (key === 'Space') {
                checkInteraction();
            }
        };

        const endHandler = (e) => {
            e.preventDefault();
            mobileKeys[key] = false;
        };

        button.addEventListener('touchstart', startHandler);
        button.addEventListener('touchend', endHandler);
        button.addEventListener('touchcancel', endHandler);
        
        // 마우스 클릭도 지원
        button.addEventListener('mousedown', startHandler);
        button.addEventListener('mouseup', endHandler);
        button.addEventListener('mouseleave', endHandler); 
    });
};

// =========================================================
// 11. 핵심 게임 로직 함수
// =========================================================

// 게임 시작/초기화 함수
function startGame() {
    score = 0;
    gameTime = MAX_GAME_TIME * 60; // 타이머 초기화
    
    // 플레이어 위치 초기화 (선택 사항)
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    
    apples = []; 
    createApples(INITIAL_APPLE_COUNT); // 사과 초기 생성: 5개
    gameStatus = 'PLAYING';
    
    interactionMessage.text = "전기 먹기 시작! 30초 동안 최대한 많이 드세요!";
    interactionMessage.visible = true;
    interactionMessage.timer = 120;
}

// 사과 초기 생성 함수
function createApples(count) {
    for (let i = 0; i < count; i++) {
        createSingleApple(); 
    }
}

// 사과 하나만 생성하는 헬퍼 함수
function createSingleApple() {
    const margin = APPLE_RADIUS + player.width / 2 + 10;
    const randX = Math.random() * (canvas.width - margin * 2) + margin;
    const randY = Math.random() * (canvas.height - margin * 2) + margin;
    apples.push({
        x: randX,
        y: randY
    });
}


function handleInput() {
    // TITLE, GAME_OVER, SUCCESS 상태에서는 이동을 막습니다. 
    if (gameStatus === 'GAME_OVER' || gameStatus === 'SUCCESS') { 
        player.dx = 0;
        player.dy = 0;
    } else {
        // TITLE 또는 PLAYING 상태에서는 이동 허용
        player.dx = 0;
        player.dy = 0;

        // 💡 [수정] 키보드 입력과 모바일 입력 모두 확인
        if (keys['ArrowUp'] || mobileKeys['ArrowUp']) {
            player.dy = -player.speed;
            player.direction = 'back';
        } else if (keys['ArrowDown'] || mobileKeys['ArrowDown']) {
            player.dy = player.speed;
            player.direction = 'front';
        }

        if (keys['ArrowLeft'] || mobileKeys['ArrowLeft']) {
            player.dx = -player.speed;
            player.direction = 'left';
        } else if (keys['ArrowRight'] || mobileKeys['ArrowRight']) {
            player.dx = player.speed;
            player.direction = 'right';
        }
    }
    
    // 스페이스 바 상호작용 처리 (키보드는 checkInteraction()을 여기서 호출)
    if (keys['Space']) { 
        checkInteraction();
    }
    
    // 💡 [수정] 키보드 스페이스바 입력은 프레임당 한 번만 처리되도록 초기화
    keys['Space'] = false; 
    
    // 💡 [추가] 모바일 스페이스바 입력은 터치 이벤트에서 처리하므로, 여기서 바로 초기화
    // (터치 이벤트는 startHandler에서 checkInteraction()을 호출하고, endHandler에서 mobileKeys['Space']를 false로 만듦)
    // 따라서, mobileKeys['Space']는 별도로 초기화하지 않고 터치 이벤트에 맡깁니다.
}

// 플레이어와 TV 간의 상호작용 확인 함수
function checkInteraction() {
    const distX = Math.abs(player.x - tv.x);
    const distY = Math.abs(player.y - tv.y);
    const interactRangeX = player.width / 2 + tv.width / 2 + 10;
    const interactRangeY = player.height / 2 + tv.height / 2 + 10;

    if (distX < interactRangeX && distY < interactRangeY) {
        if (gameStatus === 'TITLE' || gameStatus === 'GAME_OVER' || gameStatus === 'SUCCESS') { 
            // TV에 접근하여 게임 시작/재시작
            startGame();
        } else if (gameStatus === 'PLAYING') {
            // PLAYING 상태에서 상호작용 시 현재 점수/시간 표시
            const remainingSeconds = Math.ceil(gameTime / 60);
            interactionMessage.text = `현재 점수: ${score} | 남은 시간: ${remainingSeconds}초`;
            interactionMessage.visible = true;
            interactionMessage.timer = 90;
        }
    }
}

// 텔레비전 주변에 발광 효과를 그리는 함수
function drawTVGlow() {
    const distX = player.x - tv.x;
    const distY = player.y - tv.y;
    const distance = Math.sqrt(distX * distX + distY * distY); 
    const maxGlowDistance = 200; 

    if (distance < maxGlowDistance) {
        const normalizedDistance = 1 - (distance / maxGlowDistance); 
        const glowIntensity = 0.2 + (normalizedDistance * 0.6); 
        const glowRadius = tv.width / 2 + 10 + (normalizedDistance * 15); 
        
        ctx.save(); 
        ctx.shadowBlur = 15; 
        ctx.shadowColor = `rgba(255, 255, 0, ${glowIntensity})`; 

        ctx.beginPath();
        ctx.arc(tv.x, tv.y, glowRadius, 0, Math.PI * 2); 
        ctx.fillStyle = `rgba(255, 255, 255, ${glowIntensity * 0.5})`; 
        ctx.fill();
        ctx.closePath();

        ctx.restore(); 
    }
}

// 사과를 그리는 함수
function drawApples() {
    const size = APPLE_RADIUS * 2;
    for (const apple of apples) {
        if (appleImage.complete) {
            ctx.drawImage(
                appleImage, 
                apple.x - APPLE_RADIUS, 
                apple.y - APPLE_RADIUS, 
                size, 
                size
            );
        } else {
            ctx.beginPath();
            ctx.arc(apple.x, apple.y, APPLE_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = '#FF0000'; 
            ctx.fill();
            ctx.closePath();
        }
    }
}

// 사과 충돌을 확인하고 처리하는 함수 (사과 먹으면 즉시 리젠)
function checkAppleCollision() {
    if (gameStatus !== 'PLAYING') return; // 게임 중이 아니면 충돌 처리 안함

    for (let i = apples.length - 1; i >= 0; i--) {
        const apple = apples[i];
        
        const distX = player.x - apple.x;
        const distY = player.y - apple.y;
        const distance = Math.sqrt(distX * distX + distY * distY); 

        const collisionThreshold = player.width / 2 + APPLE_RADIUS - 5; 

        if (distance < collisionThreshold) {
            apples.splice(i, 1); 
            score++; 

            // 성공 조건 체크
            if (score >= SUCCESS_SCORE) {
                gameStatus = 'SUCCESS'; // SUCCESS 상태 설정 및 유지
                apples = []; // 성공 시 사과 제거
                interactionMessage.text = `🎉 축하합니다! 목표 점수 ${SUCCESS_SCORE}점 달성! 티비가 기뻐하고있어요!`;
                interactionMessage.visible = true;
                interactionMessage.timer = 300; 
                player.dx = 0;
                player.dy = 0;
                // 💡 [수정] 성공 후 TITLE 상태로 즉시 변경하지 않음. SUCCESS 상태를 유지하여 메시지를 표시하고, 
                // TV 상호작용 시 TITLE -> PLAYING으로 전환됨. (이전 코드에서 TITLE로 바꾼 줄은 제거했습니다.)
                return; 
            }
            
            // 사과를 먹을 때마다 새 사과 1개 리젠
            createSingleApple();
        }
    }
}

function drawPlayer() {
    const currentImage = playerImages[player.direction];

    if (currentImage.complete && currentImage.naturalWidth > 0) {
        ctx.drawImage(
            currentImage, 
            player.x - player.width / 2,
            player.y - player.height / 2,
            player.width, 
            player.height
        );
    } else {
        // 이미지가 로드되지 않았다면 붉은 원 표시
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FF0000';
        ctx.fill();
        ctx.closePath();
    }
}

// 점수를 TV 화면에 표시하는 함수
function drawScoreOnTV() {
    // tv.width, tv.height를 사용하여 화면 영역 계산
    const screenX = tv.x - tv.width * 0.3;  
    const screenY = tv.y - tv.height * 0.25; 
    const screenWidth = tv.width * 0.6;     
    const screenHeight = tv.height * 0.5;   

    ctx.save();
    
    ctx.font = '16px Arial'; 
    ctx.fillStyle = '#00FF00'; 
    ctx.textAlign = 'center'; 

    const centerX = screenX + screenWidth / 2;
    const centerY = screenY + screenHeight / 2;
    
    if (gameStatus === 'PLAYING') {
        const remainingSeconds = Math.ceil(gameTime / 60);
        
        ctx.fillText(`SCORE: ${score}`, centerX, centerY - 5);
        ctx.fillText(`TIME: ${remainingSeconds}`, centerX, centerY + 15);
        ctx.font = '12px Arial'; 
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`목표: ${SUCCESS_SCORE}개`, centerX, centerY + 30); // 목표 점수 표시
    } else if (gameStatus === 'TITLE') {
         ctx.font = '14px Arial';
         ctx.fillText(`SPACE/ACTION 눌러 시작`, centerX, centerY + 5);
         ctx.font = '12px Arial';
         ctx.fillStyle = '#FFFFFF';
         ctx.fillText(`목표: ${SUCCESS_SCORE}개`, centerX, centerY + 30);
    } else if (gameStatus === 'GAME_OVER') {
         ctx.font = '14px Arial';
         ctx.fillStyle = '#FF4500'; // 주황색
         ctx.fillText(`FINAL SCORE: ${score}`, centerX, centerY - 5);
         ctx.fillText(`ACTION 눌러 재시작`, centerX, centerY + 15);
    } else if (gameStatus === 'SUCCESS') { // 성공 상태 표시
         ctx.font = '14px Arial';
         ctx.fillStyle = '#00FFFF'; // 밝은 파란색
         ctx.fillText(`SUCCESS!`, centerX, centerY - 5);
         ctx.fillText(`SCORE: ${score}`, centerX, centerY + 15);
    }

    ctx.restore();
}


function drawMessage() {
    if (interactionMessage.visible) {
        ctx.font = '24px Arial'; 
        ctx.textAlign = 'center'; 

        const messageText = interactionMessage.text;
        const xPos = canvas.width / 2;
        const yPos = 50; 

        // 메시지 배경
        const textWidth = ctx.measureText(messageText).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; 
        ctx.fillRect(xPos - textWidth / 2 - 10, yPos - 30, textWidth + 20, 40);

        // 메시지 텍스트
        ctx.fillStyle = 'white';
        ctx.fillText(messageText, xPos, yPos);
    }
}

function checkBoundaries() {
    const halfW = player.width / 2;
    const halfH = player.height / 2;

    if (player.x + halfW > canvas.width) {
        player.x = canvas.width - halfW;
    }
    if (player.x - halfW < 0) {
        player.x = halfW;
    }
    
    if (player.y + halfH > canvas.height) {
        player.y = canvas.height - halfH;
    }
    if (player.y - halfH < 0) {
        player.y = halfH;
    }
}


// 메인 게임 루프
function gameLoop() {
    // 1. 배경 이미지 그리기
    if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // 2. TV 발광 효과 그리기 
    drawTVGlow(); 

    // 3. TV 이미지 그리기 (tv.width, tv.height를 사용하여 크기 조절)
    if (tvImage.complete && tvImage.naturalWidth > 0) {
        ctx.drawImage(
            tvImage, 
            tv.x - tv.width / 2, 
            tv.y - tv.height / 2, 
            tv.width, 
            tv.height
        );
    }
    
    // 4. 점수를 TV 화면에 그리기
    drawScoreOnTV();

    // 5. 사과 그리기
    drawApples();

    // 6. 입력 처리
    handleInput();
    
    // 7. 위치 업데이트
    player.x += player.dx;
    player.y += player.dy;

    // 8. 경계 충돌 처리
    checkBoundaries();

    // 9. 플레이어 그리기
    drawPlayer();
    
    // 10. 사과 충돌 확인 및 점수 업데이트
    checkAppleCollision(); 
        
    // 11. 타이머 업데이트 및 게임 오버 체크
    if (gameStatus === 'PLAYING') {
        gameTime--;
        if (gameTime <= 0) {
            gameStatus = 'GAME_OVER';
            apples = []; // 게임 오버 시 사과 제거
            interactionMessage.text = `시간 초과! 최종 점수는 ${score}점입니다. TV가 슬퍼해요ㅠㅠ`;
            interactionMessage.visible = true;
            interactionMessage.timer = 300; 
            
            // 게임 오버 시 캐릭터 이동을 막기 위해 dx/dy를 0으로 설정
            player.dx = 0;
            player.dy = 0;
            // gameStatus = 'TITLE'; <--- 삭제됨
        }
    }
        
    // 12. 메시지 그리기 및 타이머 업데이트
    drawMessage();
    
    if (interactionMessage.visible) {
        interactionMessage.timer--;
        if (interactionMessage.timer <= 0) {
            interactionMessage.visible = false;
        }
    }

    // 13. 다음 프레임 요청
    requestAnimationFrame(gameLoop);
}

// 14. 모든 이미지가 로드된 후 게임 시작
let imagesLoaded = 0;
const totalImages = Object.keys(playerImages).length + 3; // 7개 이미지

const checkStart = () => {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        console.log("모든 이미지가 로드되었습니다. 게임 시작!");
        
        // 💡 [추가] 이미지 로드 후 터치 컨트롤 이벤트 설정
        handleTouchControls(); 
        
        // 초기 TITLE 상태에서 TV로 이동하도록 메시지 표시
        interactionMessage.text = "TV에 가까이 가서 SPACE/ACTION을 눌러 게임을 시작하세요!";
        interactionMessage.visible = true;
        interactionMessage.timer = 0; 
        
        gameLoop();
    }
};

for (const key in playerImages) {
    playerImages[key].onload = checkStart;
    playerImages[key].onerror = checkStart; 
}
backgroundImage.onload = checkStart;
backgroundImage.onerror = checkStart;
appleImage.onload = checkStart; 
appleImage.onerror = checkStart; 
tvImage.onload = checkStart; 
tvImage.onerror = checkStart;
