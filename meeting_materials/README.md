# AI_TOP_100 프로필 보드 - 현재 버전 (v3)

## 📁 파일 구조
```
meeting_materials/
├── index-v3.html      # HTML 구조 (5행 레이아웃)
├── script-v3.js       # JavaScript 로직 (애니메이션, 스크롤)
├── styles-v3.css      # CSS 스타일 (애니메이션, 레이아웃)
├── data-full.json     # 106명 프로필 데이터
└── assets/            # 로고, 아이콘, 이미지
```

## ✅ 현재 구현된 기능

### 1. 레이아웃
- **5행 레이아웃**, 25개 슬롯
- 106명 프로필 배치 (짧은 시간 슬롯: 5명, 긴 시간 슬롯: 4명)
- 7680×2160 (32:9) 해상도 최적화

### 2. 노출 시간
- **슬롯별 다양한 노출 시간**: 6.0~10.8초 (0.2초 간격, 25개 모두 다름)
- 짧은 시간(6.0~7.0초): 5명 배치 → 6개 슬롯
- 긴 시간(7.2~10.8초): 4명 배치 → 19개 슬롯
- 전환 시간: 2초 (wipe-out 1초 + wipe-in 1초)

### 3. 애니메이션
- **이미지**: scale(1.0 → 0.7 → 1.0) 1초
- **텍스트**: wipe 효과 (오→왼 사라짐, 왼→오 나타남) 1초
- **언더바**: 그라데이션 + 흐름 효과

### 4. 무한 스크롤
- 가로 150px/s 속도로 부드럽게 이동
- seamless 무한 반복 (복제본 활용)
- **동적 너비 재계산**: 매 프레임마다 실제 너비 측정

### 5. 동적 요소
- 메시지 길이에 따라 슬롯 너비 자동 조정
- 각 슬롯 독립적으로 프로필 순환 (100사이클)

## 🔴 현재 발생하는 주요 이슈

### Issue #1: 무한 스크롤 리셋 시 "튀는" 현상 ⭐⭐⭐
**현상:**
- 몇 분 후 갑자기 왼쪽으로 순간이동하는 것처럼 보임
- seamless 효과가 깨짐

**원인 분석:**
- 슬롯 너비가 동적으로 변함 (메시지 길이에 따라)
- 리셋 타이밍이 실제 너비와 불일치

**현재 대응:**
```javascript
// 매 프레임(60fps)마다 너비 재계산
const currentTotalWidth = calculateTotalWidth();
if (scrollPosition >= currentTotalWidth) {
    scrollPosition = 0; // 하드 리셋
}
```

**개선 아이디어:**
1. overflow 보존: `scrollPosition -= currentTotalWidth` (넘친 만큼만 빼기)
2. 슬롯 너비 최대값으로 고정 (동적 느낌 상실 우려)
3. 변경된 슬롯만 감지해서 필요할 때만 재계산

**논의 필요:**
- 성능 vs 정확성 트레이드오프
- Layout thrashing 가능성
- ResizeObserver 활용 가능성

---

### Issue #2: 이미지/텍스트 동기화 정밀도 ⭐⭐
**현상:**
- 가끔 이미지와 텍스트 전환 타이밍이 어긋남
- 깜빡임 현상 (해결됨, 모니터링 필요)

**현재 해결 방법:**
```javascript
// 1. fade-out 완료 대기
await new Promise(resolve => setTimeout(resolve, 1000));

// 2. 투명 상태를 inline style로 고정 (깜빡임 방지)
image.style.opacity = '0';
image.style.transform = 'scale(0.7)';

// 3. 데이터 변경
image.src = nextProfile.profile_image;

// 4. 클래스 제거
imageWrapper.classList.remove('fade-out');

// 5. 리플로우 보장
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

// 6. fade-in 시작
imageWrapper.classList.add('fade-in');
```

**논의 필요:**
- Web Animations API로 전환 시 장단점?
- CSS 변수 활용?

---

### Issue #3: 성능 최적화 ⭐
**우려 사항:**
1. **매 프레임 DOM 측정**
   - `calculateTotalWidth()` → `offsetWidth` 계속 읽음
   - Reflow 유발 가능성

2. **100사이클 프로필 시퀀스 배열**
   - 각 슬롯마다 400~500개 인덱스 저장
   - 메모리 효율성?

**논의 필요:**
- 모듈로 연산으로 대체 가능?
- IntersectionObserver 활용?

---

## 📊 데이터 구조

### 프로필 배치 (106명 → 25슬롯)
```javascript
슬롯 0 (6.0s): 프로필 0,1,2,3,4 (5명) × 100사이클
슬롯 1 (7.6s): 프로필 5,6,7,8 (4명) × 100사이클
슬롯 2 (9.4s): 프로필 9,10,11,12 (4명) × 100사이클
...
슬롯 24 (10.0s): 프로필 102,103,104,105 (4명) × 100사이클
```

### 노출 시간 배치
```javascript
6.0~7.0초 (5명): 슬롯 0, 4, 12, 7, 19, 17
7.2~10.8초 (4명): 나머지 19개 슬롯
```

### 전체 노출 사이클
- **5사이클**이면 모든 106명이 최소 1번씩 등장
- 화면에 3개 슬롯 동시 표시 시: 한 순간에 3명

---

## 🎯 미팅 논의 주제

### 우선순위 1: 스크롤 튀는 현상 해결
- [ ] 성능 프로파일링 결과 확인
- [ ] overflow 보존 방식 테스트
- [ ] 대안 접근법 논의

### 우선순위 2: 성능 최적화
- [ ] Layout thrashing 측정
- [ ] 메모리 사용량 측정
- [ ] 최적화 전략 수립

### 우선순위 3: 코드 구조 개선
- [ ] 컴포넌트 기반 접근 검토 (React/Vue?)
- [ ] Web Animations API 전환 검토
- [ ] 테스트 코드 작성 계획

---

## 🚀 실행 방법

```bash
# 브라우저에서 직접 열기
open index-v3.html

# 또는 로컬 서버 실행
python3 -m http.server 8000
# http://localhost:8000/index-v3.html

# 키보드 단축키
# Space: 새로고침
# F / 더블클릭: 전체화면 토글
```

---

## 📝 추가 정보

**작업 환경:**
- 해상도: 7680×2160 (32:9)
- 개발 도구: Claude Code (바이브코딩)
- 테스트 브라우저: Safari, Chrome

**관련 파일:**
- 백업: `/backups/` 폴더
- 이전 버전: `index-v2.html`, `script-v2.js` 등

**문의:**
- GitHub Issues (있는 경우)
- 직접 연락
