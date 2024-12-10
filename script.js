const video = document.getElementById('video');
const expressionDiv = document.getElementById('expression');
const colorBox = document.getElementById('colorBox'); 
const clickText = document.getElementById('clickText');
const title = document.querySelector('h1');
const subtitle = document.querySelector('p');
const emotionResult = document.getElementById('emotionResult');
const mainEmotionText = document.getElementById('mainEmotion');
const finalColorBox = document.getElementById('finalColorBox');
let finalColor = '';
let mainEmotion = '';

// 감정별 음악 객체 생성
const audioMap = {
    anger: new Audio('./audio/anger.mp3'),
    happy: new Audio('./audio/happy.mp3'),
    sad: new Audio('./audio/sad.mp3'),
    neutral: new Audio('./audio/neutral.mp3'),
    surprised: new Audio('./audio/surprised.mp3'),
    fear: new Audio('./audio/fear.mp3'),
};

// 초기 상태: 클릭 텍스트를 필요할 때만 표시
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        clickText.style.display = 'block'; // 화면 초기 표시
    }, 3000); // 페이드인 후 나타나도록 지연
});

// 클릭 시 이벤트: 모든 음악 볼륨 0으로 재생 및 감정 인식 준비
clickText.addEventListener('click', () => {
    clickText.style.display = 'none'; // 클릭 후 텍스트 숨김

    // 모든 음악을 볼륨 0으로 재생
    Object.values(audioMap).forEach(audio => {
        audio.volume = 0;
        audio.loop = true;
        audio.play();
    });

    title.style.display = 'none';
    subtitle.textContent = "잠시 후 카메라가 켜집니다. 카메라를 보며 담고 싶은 감정을 표정으로 드러내주세요.";
    setTimeout(() => {
        subtitle.style.display = 'none';
        startVideo();
        video.style.display = 'block';
        colorBox.style.display = 'block';
        expressionDiv.style.display = 'block';

        // 5초 후 컬러와 메인 감정을 저장하고 카메라 종료
        setTimeout(() => {
            stopVideo();
            adjustMusicVolume(mainEmotion);
            showFinalResult();
        }, 5000);
    }, 3000); // 안내 문구 후 3초 대기
});

// 모델 파일 로드
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceExpressionNet.loadFromUri('./models')
]);

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => video.srcObject = stream)
        .catch(err => console.error(err));
}

function stopVideo() {
    const stream = video.srcObject;
    const tracks = stream.getTracks();

    tracks.forEach(track => track.stop());
    video.srcObject = null;
}

function showFinalResult() {
    video.style.display = 'none';
    colorBox.style.display = 'none';
    expressionDiv.style.display = 'none';

    emotionResult.style.display = 'flex';
    finalColorBox.style.background = finalColor;
    mainEmotionText.textContent = mainEmotion;
}

video.addEventListener('play', () => {
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

        if (detections.length > 0) {
            const expressions = detections[0].expressions;

            const anger = expressions.anger || 0;
            const happy = expressions.happy || 0;
            const sad = expressions.sad || 0;
            const neutral = expressions.neutral || 0;
            const surprised = expressions.surprised || 0;
            const fear = expressions.fear || 0;

            const red = Math.round(
                anger * 255 +
                happy * 255 +
                surprised * 255 +
                fear * 128
            );
            const green = Math.round(
                happy * 255 +
                neutral * 255 +
                surprised * 165
            );
            const blue = Math.round(
                sad * 255 +
                neutral * 255 +
                fear * 255
            );

            finalColor = `rgb(${red}, ${green}, ${blue})`; // 저장된 최종 컬러

            const highestExpression = Object.keys(expressions).reduce((a, b) =>
                expressions[a] > expressions[b] ? a : b
            );

            mainEmotion = highestExpression; // 메인 감정 저장
            colorBox.style.background = finalColor;

            expressionDiv.textContent = `Detected Expression: ${highestExpression}`;
        }
    }, 100);
});

function adjustMusicVolume(emotion) {
    // 모든 음악 볼륨을 0으로 설정
    Object.values(audioMap).forEach(audio => audio.volume = 0);

    // 메인 감정 음악 볼륨 높이기
    if (audioMap[emotion]) {
        audioMap[emotion].volume = 1;
    }
}
