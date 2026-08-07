# 여행 플래너

친구들과 함께 쓰는 여행 계획 앱 — 일정, 예산, 준비물, 사진첩

## 로컬에서 실행해보기

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 열면 앱이 보여요.

## 배포하기 (Vercel)

1. 이 폴더를 GitHub 저장소에 올려요.
2. [vercel.com](https://vercel.com)에 GitHub 계정으로 로그인해요.
3. "New Project" → 방금 올린 저장소 선택 → Deploy 누르면 끝.
   (Framework는 자동으로 Vite로 인식돼요. 설정 건드릴 것 없어요.)
4. 배포되면 `프로젝트이름.vercel.app` 같은 실제 주소가 생겨요.

## 네이버 지도 연결 시 주의

일정 탭의 네이버 지도는 **등록한 도메인에서만** 작동해요.
[console.ncloud.com](https://console.ncloud.com)의 Maps API 설정에서
"Web 서비스 URL"에 위에서 생긴 Vercel 주소를 추가로 등록해야
그 주소에서 지도가 떠요. (로컬 `localhost`에서 테스트하려면
`http://localhost:5173`도 같이 등록하면 돼요.)

## 홈 화면에 앱처럼 추가하기 (PWA)

배포된 링크를 폰 브라우저로 열고 "홈 화면에 추가"를 누르면
앱 아이콘처럼 홈 화면에 생겨요. 아이폰·갤럭시 둘 다 가능해요.

## 다음 단계: 실시간 공유 (Firebase)

지금은 이 프로젝트 안 데이터가 브라우저에만 저장돼요. 여러 명이
같은 데이터를 실시간으로 보고 수정하려면 Firebase(Firestore)를
연결해야 해요 — 이건 다음 단계에서 같이 진행해요.
