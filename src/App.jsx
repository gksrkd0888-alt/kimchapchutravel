import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { collection, doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  MapPin,
  Clock,
  Calendar,
  Wallet,
  ListChecks,
  Check,
  Map,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  X,
  Home,
  Car,
  Utensils,
  Camera,
  Search,
  Pencil,
  Bus,
  Footprints,
  TrainFront,
  Plane,
  CloudSun,
  PieChart,
  Share2,
  RefreshCw,
} from "lucide-react";

// ---- design tokens ----
const INK = "#23262B";
const MUTE = "#9498A0";
const LINE = "#E7E5DF";
const ACCENT = "#4E7C77";
const ACCENT_SOFT = "#E7EFEE";
const PAPER = "#FAFAF7";
const PANEL = "#F1F0EB";
const WARN = "#C4746C";
const AMBER = "#B8863F";
const SLATE = "#6B7280";

const FONT = "'Pretendard', -apple-system, BlinkMacSystemFont, 'Malgun Gothic', sans-serif";

function uid(prefix) {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}`;
}

// ---- 일정 카테고리 ----
const STOP_CATEGORIES = [
  { id: "sight", label: "관광", icon: Camera, color: ACCENT },
  { id: "food", label: "밥집", icon: Utensils, color: AMBER },
  { id: "lodging", label: "숙소", icon: Home, color: WARN },
  { id: "transport", label: "이동", icon: Car, color: SLATE },
];
function getCategory(id) {
  return STOP_CATEGORIES.find((c) => c.id === id) || STOP_CATEGORIES[0];
}

// ---- 준비물 카테고리 ----
const CHECKLIST_CATEGORIES = ["의류", "전자기기", "세면용품", "서류/티켓", "기타"];

// ---- 초기 시드 여행 ----
function seedTrip() {
  return {
    id: uid("t"),
    name: "여수 1박 2일",
    startDate: "2026-10-18",
    endDate: "2026-10-19",
    members: ["챱츄", "민지", "현우", "소율"],
    days: [
      {
        id: "d1",
        label: "1일차",
        date: "10월 18일 (토)",
        stops: [
          { id: "s1", time: "09:00", title: "서울역 출발", place: "KTX 승차", note: "", lat: 37.5547, lng: 126.9707, category: "transport", checkOut: "", travelStart: null, travelEnd: null, transportMode: "train" },
          { id: "s2", time: "11:20", title: "여수엑스포역 도착", place: "", note: "짐 보관 후 이동", lat: 34.744, lng: 127.7447, category: "transport", checkOut: "", travelStart: null, travelEnd: null, transportMode: "train" },
          { id: "s3", time: "12:00", title: "여수 게장백반", place: "교동시장 인근", note: "", lat: 34.7604, lng: 127.6622, category: "food", checkOut: "", travelStart: "11:40", travelEnd: "12:00", transportMode: "walk" },
          { id: "s5", time: "15:00", title: "여수 오션뷰 호텔", place: "만성리", note: "", lat: 34.7699, lng: 127.6883, category: "lodging", checkOut: "11:00", travelStart: "14:45", travelEnd: "15:00", transportMode: "car" },
        ],
      },
      { id: "d2", label: "2일차", date: "10월 19일 (일)", stops: [{ id: "s4", time: "09:30", title: "향일암", place: "돌산읍", note: "", lat: 34.6664, lng: 127.7431, category: "sight", checkOut: "", travelStart: null, travelEnd: null, transportMode: "car" }] },
    ],
    expenses: [
      { id: "e1", title: "KTX 왕복", amount: 220000, payer: "챱츄", category: "교통" },
      { id: "e2", title: "숙소 1박", amount: 160000, payer: "민지", category: "숙박" },
    ],
    checklist: [
      { id: "c1", label: "숙소 예약 확인증", category: "서류/티켓", done: true },
      { id: "c2", label: "카메라 배터리·SD카드", category: "전자기기", done: false },
      { id: "c3", label: "우산 / 우비", category: "의류", done: false },
    ],
    photos: [],
    payments: [],
  };
}

function inputStyle(width) {
  return {
    width,
    padding: "8px 10px",
    fontSize: 13,
    border: `1px solid ${LINE}`,
    borderRadius: 6,
    outline: "none",
    background: PAPER,
    color: INK,
  };
}
function iconBtn(disabled) {
  return { border: "none", background: "none", color: disabled ? "#D6D4CD" : MUTE, cursor: disabled ? "default" : "pointer", padding: 3 };
}
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

// 브라우저/OS 로케일에 따라 <input type="time">이 오전·오후로 뜨는 문제를 피하려고
// 시(0-23)·분(5분 단위) 두 개의 select로 직접 만든 24시간제 시간 입력.
function TimeSelect({ value, onChange }) {
  const [h, m] = (value || "").split(":");
  const selectStyle = { ...inputStyle(52), padding: "8px 4px", textAlign: "center" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <select value={h || ""} onChange={(e) => onChange(`${e.target.value}:${m || "00"}`)} style={selectStyle}>
        <option value="" disabled>--</option>
        {HOUR_OPTIONS.map((hh) => <option key={hh} value={hh}>{hh}</option>)}
      </select>
      <span style={{ color: MUTE, fontSize: 12 }}>:</span>
      <select value={m || ""} onChange={(e) => onChange(`${h || "00"}:${e.target.value}`)} style={selectStyle}>
        <option value="" disabled>--</option>
        {MINUTE_OPTIONS.map((mm) => <option key={mm} value={mm}>{mm}</option>)}
      </select>
    </div>
  );
}

const TIME_PRESETS = ["09:00", "12:00", "15:00", "18:00", "21:00"];
function TimeQuickPicks({ onPick }) {
  return (
    <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
      {TIME_PRESETS.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onPick(t)}
          style={{ fontSize: 10, color: MUTE, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 4, padding: "2px 6px", cursor: "pointer" }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 10, color: MUTE, fontWeight: 600 }}>{label}</span>
      {children}
    </div>
  );
}

function primaryBtn() {
  return {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    color: PAPER,
    background: ACCENT,
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  };
}
function buildMapRouteUrl(stops) {
  const points = stops.map((s) => encodeURIComponent(s.place?.trim() || s.title));
  return `https://www.google.com/maps/dir/${points.join("/")}`;
}
// "HH:mm" 두 시각 사이의 분 차이를 계산한다 (자정을 넘기면 다음날로 간주).
function minutesBetween(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => isNaN(n))) return null;
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff;
}
// 장소 이름 → 좌표. 별도 계정/키 없이 쓸 수 있는 OpenStreetMap Nominatim을 사용한다.
// (네이버 지오코딩보다 정확도는 낮을 수 있어, 결과가 이상하면 좌표를 직접 수정해도 좋다.)
async function geocodePlace(query) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("geocode failed");
  const data = await res.json();
  if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  return null;
}
// "YYYY-MM-DD" 시작일에 dayOffset(0부터)일을 더한 날짜 문자열을 돌려준다.
function addDaysToDateStr(dateStr, dayOffset) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}
// 계정/키 없이 쓸 수 있는 Open-Meteo로 특정 좌표·날짜의 일별 날씨를 가져온다.
async function fetchDailyWeather(lat, lng, dateStr) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather fetch failed");
  const data = await res.json();
  if (!data.daily || !data.daily.time || data.daily.time.length === 0) return null;
  return {
    code: data.daily.weathercode[0],
    max: Math.round(data.daily.temperature_2m_max[0]),
    min: Math.round(data.daily.temperature_2m_min[0]),
  };
}
// WMO 날씨 코드를 간단한 이모지+설명으로 변환한다.
function describeWeatherCode(code) {
  if (code === 0) return { emoji: "☀️", label: "맑음" };
  if ([1, 2].includes(code)) return { emoji: "🌤️", label: "대체로 맑음" };
  if (code === 3) return { emoji: "☁️", label: "흐림" };
  if ([45, 48].includes(code)) return { emoji: "🌫️", label: "안개" };
  if ([51, 53, 55, 56, 57].includes(code)) return { emoji: "🌦️", label: "이슬비" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { emoji: "🌧️", label: "비" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { emoji: "❄️", label: "눈" };
  if ([95, 96, 99].includes(code)) return { emoji: "⛈️", label: "뇌우" };
  return { emoji: "🌡️", label: "" };
}

// 하루 일정을 카드 형태의 PNG 이미지로 그린다. 외부 라이브러리 없이 Canvas API만 사용한다.
function drawItineraryCanvas(day, tripName) {
  const width = 640;
  const padding = 28;
  const headerHeight = 96;
  const rowHeight = 74;
  const travelRowHeight = 34;
  const footerHeight = 46;

  let contentHeight = 0;
  day.stops.forEach((s, i) => {
    if (i > 0 && (s.travelStart || s.travelEnd)) contentHeight += travelRowHeight;
    contentHeight += rowHeight;
  });
  const height = headerHeight + contentHeight + footerHeight + padding;

  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = ACCENT_SOFT;
  ctx.fillRect(0, 0, width, headerHeight);
  ctx.fillStyle = ACCENT;
  ctx.font = "700 13px 'Pretendard', sans-serif";
  ctx.fillText(tripName || "여행 일정", padding, 32);
  ctx.fillStyle = INK;
  ctx.font = "700 24px 'Pretendard', sans-serif";
  ctx.fillText(day.label, padding, 62);
  ctx.fillStyle = MUTE;
  ctx.font = "400 13px 'Pretendard', sans-serif";
  ctx.fillText(day.date || "", padding, 84);

  let y = headerHeight + 30;
  day.stops.forEach((s, i) => {
    if (i > 0 && (s.travelStart || s.travelEnd)) {
      const mode = getTransportMode(s.transportMode).label;
      let text = `${mode} · `;
      if (s.travelStart && s.travelEnd) text += `${s.travelStart} → ${s.travelEnd}`;
      else if (s.travelStart) text += `${s.travelStart} 출발`;
      else text += `${s.travelEnd} 도착`;
      ctx.fillStyle = MUTE;
      ctx.font = "400 11px 'Pretendard', sans-serif";
      ctx.fillText(text, padding + 16, y);
      y += travelRowHeight;
    }

    const cat = getCategory(s.category);
    ctx.fillStyle = cat.color;
    ctx.beginPath();
    ctx.arc(padding + 4, y - 4, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = cat.color;
    ctx.font = "700 11px 'Pretendard', sans-serif";
    ctx.fillText(cat.label, padding + 16, y - 1);

    ctx.fillStyle = MUTE;
    ctx.font = "600 12px 'Pretendard', sans-serif";
    const timeText = cat.id === "lodging" ? `체크인 ${s.time}${s.checkOut ? " · 체크아웃 " + s.checkOut : ""}` : s.time;
    ctx.fillText(timeText, padding + 60, y - 1);

    ctx.fillStyle = INK;
    ctx.font = "700 16px 'Pretendard', sans-serif";
    ctx.fillText(s.title, padding + 16, y + 20);

    if (s.place) {
      ctx.fillStyle = "#65686F";
      ctx.font = "400 12px 'Pretendard', sans-serif";
      ctx.fillText(`📍 ${s.place}`, padding + 16, y + 40);
    }

    y += rowHeight;
  });

  ctx.strokeStyle = LINE;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();
  ctx.fillStyle = MUTE;
  ctx.font = "400 11px 'Pretendard', sans-serif";
  ctx.fillText("여행 일정표", padding, y + 26);

  return canvas;
}

// 그린 이미지를 모바일에서는 공유 시트로, 그 외에는 다운로드로 내보낸다.
function shareItineraryImage(day, tripName) {
  const canvas = drawItineraryCanvas(day, tripName);
  const fileName = `${tripName || "여행일정"}-${day.label}.png`.replace(/\s+/g, "");
  exportCanvasAsImage(canvas, fileName, `${tripName || ""} ${day.label}`);
}

// 캔버스를 PNG로 바꿔 모바일에서는 공유 시트로, 그 외에는 다운로드로 내보내는 공용 로직.
function exportCanvasAsImage(canvas, fileName, shareTitle) {
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: shareTitle });
        return;
      } catch {
        // 사용자가 취소했거나 공유 실패 시 아래 다운로드로 대체
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}

// 예산 요약(카테고리별 지출 + 남은 정산)을 카드 이미지로 그린다.
function drawBudgetCanvas({ tripName, total, perPerson, categoriesWithSum, transactions }) {
  const width = 640;
  const padding = 28;
  const headerHeight = 96;
  const statsHeight = 56;
  const sectionLabelHeight = 30;
  const catRowHeight = 34;
  const settleRowHeight = 32;

  const catCount = categoriesWithSum.length;
  const settleCount = Math.max(transactions.length, 1);
  const height =
    headerHeight + statsHeight + sectionLabelHeight + catCount * catRowHeight + sectionLabelHeight + settleCount * settleRowHeight + padding + 30;

  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = ACCENT_SOFT;
  ctx.fillRect(0, 0, width, headerHeight);
  ctx.fillStyle = ACCENT;
  ctx.font = "700 13px 'Pretendard', sans-serif";
  ctx.fillText(tripName || "여행", padding, 32);
  ctx.fillStyle = INK;
  ctx.font = "700 24px 'Pretendard', sans-serif";
  ctx.fillText("예산 정산", padding, 62);
  ctx.fillStyle = MUTE;
  ctx.font = "400 13px 'Pretendard', sans-serif";
  ctx.fillText(`총 지출 ${total.toLocaleString()}원 · 1인당 ${Math.round(perPerson).toLocaleString()}원`, padding, 84);

  let y = headerHeight + 34;
  ctx.fillStyle = INK;
  ctx.font = "700 13px 'Pretendard', sans-serif";
  ctx.fillText("카테고리별 지출", padding, y);
  y += sectionLabelHeight;

  categoriesWithSum.forEach(({ cat, sum }) => {
    const pct = Math.round((sum / total) * 100);
    const color = EXPENSE_CATEGORY_COLORS[cat] || MUTE;
    ctx.fillStyle = INK;
    ctx.font = "600 12px 'Pretendard', sans-serif";
    ctx.fillText(cat, padding, y);
    ctx.fillStyle = MUTE;
    ctx.font = "400 11px 'Pretendard', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${pct}% · ${sum.toLocaleString()}원`, width - padding, y);
    ctx.textAlign = "left";

    const barY = y + 6;
    const barWidth = width - padding * 2;
    ctx.fillStyle = PANEL;
    ctx.fillRect(padding, barY, barWidth, 6);
    ctx.fillStyle = color;
    ctx.fillRect(padding, barY, (barWidth * pct) / 100, 6);

    y += catRowHeight;
  });

  y += 6;
  ctx.fillStyle = INK;
  ctx.font = "700 13px 'Pretendard', sans-serif";
  ctx.fillText("남은 정산", padding, y);
  y += sectionLabelHeight;

  if (transactions.length === 0) {
    ctx.fillStyle = MUTE;
    ctx.font = "400 12px 'Pretendard', sans-serif";
    ctx.fillText("정산할 내역이 없어요.", padding, y);
    y += settleRowHeight;
  } else {
    transactions.forEach((t) => {
      ctx.fillStyle = WARN;
      ctx.font = "700 13px 'Pretendard', sans-serif";
      ctx.fillText(t.from, padding, y);
      const fromWidth = ctx.measureText(t.from).width;
      ctx.fillStyle = MUTE;
      ctx.font = "400 12px 'Pretendard', sans-serif";
      ctx.fillText("→", padding + fromWidth + 8, y);
      ctx.fillStyle = ACCENT;
      ctx.font = "700 13px 'Pretendard', sans-serif";
      ctx.fillText(t.to, padding + fromWidth + 26, y);
      ctx.fillStyle = INK;
      ctx.font = "700 13px 'Pretendard', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${Math.round(t.amount).toLocaleString()}원`, width - padding, y);
      ctx.textAlign = "left";
      y += settleRowHeight;
    });
  }

  ctx.strokeStyle = LINE;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();
  ctx.fillStyle = MUTE;
  ctx.font = "400 11px 'Pretendard', sans-serif";
  ctx.fillText("여행 예산 정산", padding, y + 24);

  return canvas;
}

function shareBudgetImage({ tripName, total, perPerson, categoriesWithSum, transactions }) {
  const canvas = drawBudgetCanvas({ tripName, total, perPerson, categoriesWithSum, transactions });
  const fileName = `${tripName || "여행"}-예산정산.png`.replace(/\s+/g, "");
  exportCanvasAsImage(canvas, fileName, `${tripName || ""} 예산 정산`);
}
// 화면에서 보는 화질은 거의 그대로 유지하면서 파일 용량만 줄인다.
// 원본이 화면 표시에 필요한 크기보다 훨씬 크면(요즘 폰 사진은 대부분 그렇다) 긴 변을 maxDim으로 맞추고,
// 고품질 JPEG(quality)로 다시 인코딩해 용량을 크게 줄인다. 이미 작은 이미지는 리사이즈하지 않는다.
function compressImage(file, { maxDim = 1920, quality = 0.9 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("image load failed"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("file read failed"));
    reader.readAsDataURL(file);
  });
}
function settleDebts(members, paidByMember, perPerson) {
  const balances = members.map((m) => ({ name: m, diff: (paidByMember[m] || 0) - perPerson }));
  const creditors = balances.filter((b) => b.diff > 0.5).sort((a, b) => b.diff - a.diff);
  const debtors = balances.filter((b) => b.diff < -0.5).sort((a, b) => a.diff - b.diff);
  const transactions = [];
  let ci = 0, di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt = debtors[di];
    const amount = Math.min(credit.diff, -debt.diff);
    if (amount > 0.5) {
      transactions.push({ from: debt.name, to: credit.name, amount });
      credit.diff -= amount;
      debt.diff += amount;
    }
    if (credit.diff <= 0.5) ci += 1;
    if (debt.diff >= -0.5) di += 1;
  }
  return transactions;
}

const TRIP_STATUS_META = {
  upcoming: { label: "여행 전", color: SLATE },
  ongoing: { label: "여행중", color: ACCENT },
  done: { label: "여행 완료", color: MUTE },
};
// 여행의 시작/종료일과 오늘 날짜를 비교해 상태를 계산한다.
// 오늘부터 여행 시작일까지 남은 일수를 "D-3" / "D-DAY" / "D+2" 형태로 만든다.
function getDDay(trip) {
  if (!trip.startDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(trip.startDate + "T00:00:00");
  const diffDays = Math.round((start - today) / 86400000);
  if (diffDays > 0) return `D-${diffDays}`;
  if (diffDays === 0) return "D-DAY";
  return `D+${Math.abs(diffDays)}`;
}

function getTripStatus(trip) {
  if (!trip.startDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(trip.startDate + "T00:00:00");
  const end = new Date((trip.endDate || trip.startDate) + "T00:00:00");
  if (today < start) return "upcoming";
  if (today > end) return "done";
  return "ongoing";
}

// ================= 최상위: 여행 목록 + 여행 화면 =================
// Firestore의 "trips" 컬렉션과 실시간으로 동기화됩니다.
// 누군가 문서를 추가/수정/삭제하면 onSnapshot이 즉시 감지해서
// 이 화면을 보고 있는 모든 사람에게 자동으로 반영돼요 (새로고침 필요 없음).
export default function TripPlannerApp() {
  const [trips, setTrips] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTripId, setActiveTripId] = useState(null);
  const [newTripName, setNewTripName] = useState("");
  const [newTripStart, setNewTripStart] = useState("");
  const [newTripEnd, setNewTripEnd] = useState("");
  const [showNewTripForm, setShowNewTripForm] = useState(false);
  const [editingTripId, setEditingTripId] = useState(null);
  const [editTripDraft, setEditTripDraft] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "trips"),
      (snapshot) => {
        const next = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTrips(next);
        setLoaded(true);
      },
      (err) => {
        console.error("Firestore 연결 실패:", err);
        setLoaded(true);
      }
    );
    return () => unsubscribe();
  }, []);

  async function addTrip() {
    if (!newTripName.trim()) return;
    const id = uid("t");
    const trip = {
      name: newTripName.trim(),
      startDate: newTripStart || null,
      endDate: newTripEnd || null,
      members: [],
      days: [{ id: uid("d"), label: "1일차", date: "", stops: [] }],
      expenses: [],
      checklist: [],
      photos: [],
      payments: [],
    };
    await setDoc(doc(db, "trips", id), trip);
    setNewTripName("");
    setNewTripStart("");
    setNewTripEnd("");
    setShowNewTripForm(false);
    setActiveTripId(id);
  }
  async function deleteTrip(id) {
    await deleteDoc(doc(db, "trips", id));
  }
  async function updateTrip(id, updater) {
    const current = trips.find((t) => t.id === id);
    if (!current) return;
    const patch = updater(current);
    // 낙관적 업데이트: Firestore 응답을 기다리지 않고 화면에 바로 반영해서 입력이 끊기지 않게 함.
    // 실제 값은 곧이어 onSnapshot으로 다시 확인/동기화됨.
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    await setDoc(doc(db, "trips", id), patch, { merge: true });
  }
  function startEditTrip(t) {
    setEditingTripId(t.id);
    setEditTripDraft({ name: t.name, startDate: t.startDate || "", endDate: t.endDate || "" });
  }
  function cancelEditTrip() {
    setEditingTripId(null);
    setEditTripDraft(null);
  }
  async function saveEditTrip() {
    if (!editTripDraft.name.trim()) return;
    const patch = { name: editTripDraft.name.trim(), startDate: editTripDraft.startDate || null, endDate: editTripDraft.endDate || null };
    setTrips((prev) => prev.map((t) => (t.id === editingTripId ? { ...t, ...patch } : t)));
    setEditingTripId(null);
    setEditTripDraft(null);
    await setDoc(doc(db, "trips", editingTripId), patch, { merge: true });
  }

  const activeTrip = trips.find((t) => t.id === activeTripId);

  if (activeTrip) {
    return (
      <TravelApp
        trip={activeTrip}
        onUpdate={(updater) => updateTrip(activeTrip.id, updater)}
        onBack={() => setActiveTripId(null)}
      />
    );
  }

  return (
    <div style={{ fontFamily: FONT, background: PAPER, color: INK, maxWidth: 640, margin: "0 auto", border: `1px solid ${LINE}`, minHeight: 400, padding: "24px 28px" }} className="tp-pad">
      <style>{`
        @media (max-width: 620px) {
          .tp-pad { padding: 18px 16px !important; }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>내 여행</div>
        <button onClick={() => setShowNewTripForm((v) => !v)} style={primaryBtn()}>
          <Plus size={13} /> 새 여행
        </button>
      </div>

      {showNewTripForm && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, padding: 14, background: PANEL, borderRadius: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label="여행 이름">
            <input
              placeholder="예: 부산 벚꽃 여행"
              value={newTripName}
              onChange={(e) => setNewTripName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTrip()}
              style={inputStyle(200)}
              autoFocus
            />
          </Field>
          <Field label="시작일 (선택)">
            <input type="date" value={newTripStart} onChange={(e) => setNewTripStart(e.target.value)} style={inputStyle(140)} />
          </Field>
          <Field label="종료일 (선택)">
            <input type="date" value={newTripEnd} onChange={(e) => setNewTripEnd(e.target.value)} style={inputStyle(140)} />
          </Field>
          <button onClick={addTrip} style={primaryBtn()}>만들기</button>
        </div>
      )}

      {!loaded && <div style={{ fontSize: 13, color: MUTE }}>불러오는 중…</div>}
      {loaded && trips.length === 0 && <div style={{ fontSize: 13, color: MUTE }}>아직 등록한 여행이 없어요. "새 여행"으로 시작해보세요.</div>}

      {trips.map((t) => {
        const dayCount = t.days.length;
        const stopCount = t.days.reduce((s, d) => s + d.stops.length, 0);
        const status = getTripStatus(t);
        const statusMeta = status ? TRIP_STATUS_META[status] : null;

        if (editingTripId === t.id) {
          return (
            <div key={t.id} style={{ padding: 14, border: `1px solid ${LINE}`, borderRadius: 8, marginBottom: 10, background: PANEL }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                <Field label="여행 이름">
                  <input value={editTripDraft.name} onChange={(e) => setEditTripDraft({ ...editTripDraft, name: e.target.value })} style={inputStyle(180)} autoFocus />
                </Field>
                <Field label="시작일">
                  <input type="date" value={editTripDraft.startDate} onChange={(e) => setEditTripDraft({ ...editTripDraft, startDate: e.target.value })} style={inputStyle(130)} />
                </Field>
                <Field label="종료일">
                  <input type="date" value={editTripDraft.endDate} onChange={(e) => setEditTripDraft({ ...editTripDraft, endDate: e.target.value })} style={inputStyle(130)} />
                </Field>
                <button onClick={saveEditTrip} style={primaryBtn()}>저장</button>
                <button onClick={cancelEditTrip} style={{ ...iconBtn(false), padding: "8px 12px", fontSize: 12, fontWeight: 600 }}>취소</button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              border: `1px solid ${LINE}`,
              borderRadius: 8,
              marginBottom: 10,
              cursor: "pointer",
            }}
            onClick={() => setActiveTripId(t.id)}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{t.name}</span>
                {statusMeta && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: statusMeta.color, background: `${statusMeta.color}17`, padding: "2px 8px", borderRadius: 10 }}>
                    {statusMeta.label}
                  </span>
                )}
                {status === "upcoming" && (
                  <span style={{ fontSize: 10, fontWeight: 800, color: PAPER, background: ACCENT, padding: "2px 8px", borderRadius: 10 }}>
                    {getDDay(t)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: MUTE, marginTop: 3 }}>
                {dayCount}일 일정 · 코스 {stopCount}개 {t.members.length > 0 && `· 멤버 ${t.members.length}명`}
              </div>
            </div>
            <div style={{ display: "flex", gap: 2, alignItems: "center", flexShrink: 0 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEditTrip(t);
                }}
                style={iconBtn(false)}
                title="여행 이름/날짜 수정"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`"${t.name}" 여행을 삭제할까요?`)) deleteTrip(t.id);
                }}
                style={iconBtn(false)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ================= 개별 여행 화면 (탭) =================
const TABS = [
  { id: "itinerary", label: "일정", icon: Calendar },
  { id: "photos", label: "사진첩", icon: ImageIcon },
  { id: "budget", label: "예산", icon: Wallet },
  { id: "checklist", label: "준비물", icon: ListChecks },
];

function TravelApp({ trip, onUpdate, onBack }) {
  const [tab, setTab] = useState("itinerary");
  const [refreshState, setRefreshState] = useState("idle"); // idle | spinning | done

  const setDays = (days) => onUpdate(() => ({ days }));
  const setMembers = (members) => onUpdate(() => ({ members }));
  const setExpenses = (expenses) => onUpdate(() => ({ expenses }));
  const setChecklist = (checklist) => onUpdate(() => ({ checklist }));
  const setPhotos = (photos) => onUpdate(() => ({ photos }));
  const setPayments = (payments) => onUpdate(() => ({ payments }));

  // 지금은 데이터가 이 화면 안 상태에만 있어서 편집 즉시 반영돼(따로 새로고침할 게 없어).
  // Firebase(Firestore)를 연결하면 이 자리에서 최신 데이터를 다시 불러오는 로직(onSnapshot/getDoc)이 들어가면 돼 —
  // 그때를 위해 버튼과 자리만 미리 만들어둔다.
  function handleRefresh() {
    setRefreshState("spinning");
    setTimeout(() => {
      setRefreshState("done");
      setTimeout(() => setRefreshState("idle"), 1200);
    }, 500);
  }

  return (
    <div style={{ fontFamily: FONT, background: PAPER, color: INK, maxWidth: 880, margin: "0 auto", border: `1px solid ${LINE}`, minHeight: 560 }}>
      <style>{`
        @media (max-width: 620px) {
          .tp-stack { flex-direction: column !important; }
          .tp-day-sidebar { width: 100% !important; display: flex !important; overflow-x: auto !important; gap: 6px !important; padding-bottom: 4px; }
          .tp-day-sidebar > div { flex-shrink: 0; }
          .tp-day-addbtn { width: auto !important; flex-shrink: 0; margin-top: 0 !important; }
          .tp-pad { padding: 18px 16px !important; }
        }
        @keyframes tp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ padding: "18px 24px 0", borderBottom: `1px solid ${LINE}` }} className="tp-pad">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={onBack} style={{ border: "none", background: "none", color: MUTE, cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}>
              <ArrowLeft size={14} />
            </button>
            <div style={{ fontSize: 12, letterSpacing: "0.08em", color: MUTE, fontWeight: 600 }}>{trip.name}</div>
          </div>
          <button
            onClick={handleRefresh}
            style={{ display: "flex", alignItems: "center", gap: 5, border: "none", background: "none", color: refreshState === "done" ? ACCENT : MUTE, cursor: "pointer", fontSize: 11, fontWeight: 600, padding: 0 }}
            title="최신 상태로 새로고침"
          >
            <RefreshCw size={13} style={refreshState === "spinning" ? { animation: "tp-spin 0.6s linear" } : undefined} />
            {refreshState === "done" ? "최신 상태예요" : "새로고침"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 14px",
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? INK : MUTE,
                  background: "none",
                  border: "none",
                  borderBottom: active ? `2px solid ${ACCENT}` : "2px solid transparent",
                  cursor: "pointer",
                  marginBottom: -1,
                }}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "24px 28px" }} className="tp-pad">
        {tab === "itinerary" && <ItineraryTab days={trip.days} setDays={setDays} tripStartDate={trip.startDate} tripName={trip.name} />}
        {tab === "photos" && <PhotoAlbumTab days={trip.days} photos={trip.photos || []} setPhotos={setPhotos} />}
        {tab === "budget" && <BudgetTab members={trip.members} setMembers={setMembers} expenses={trip.expenses} setExpenses={setExpenses} payments={trip.payments || []} setPayments={setPayments} tripName={trip.name} />}
        {tab === "checklist" && <ChecklistTab items={trip.checklist} setItems={setChecklist} members={trip.members} />}
      </div>
    </div>
  );
}

function PhotoLightbox({ item, onClose }) {
  if (!item) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(35,38,43,0.6)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        cursor: "zoom-out",
        padding: 24,
      }}
    >
      <img
        src={item.src}
        alt={item.title}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "min(90vw, 640px)", maxHeight: "85vh", borderRadius: 10, boxShadow: "0 20px 60px rgba(0,0,0,0.35)", cursor: "default" }}
      />
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.9)",
          color: INK,
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        title="닫기"
      >
        <X size={16} />
      </button>
    </div>
  );
}

const TRANSPORT_MODES = [
  { id: "car", label: "자동차", icon: Car },
  { id: "transit", label: "대중교통", icon: Bus },
  { id: "walk", label: "도보", icon: Footprints },
  { id: "train", label: "기차", icon: TrainFront },
  { id: "flight", label: "비행기", icon: Plane },
];
function getTransportMode(id) {
  return TRANSPORT_MODES.find((m) => m.id === id) || TRANSPORT_MODES[0];
}

const EXPENSE_CATEGORIES = ["숙박", "식비", "교통", "관광/액티비티", "기타"];
const EXPENSE_CATEGORY_COLORS = { 숙박: WARN, 식비: AMBER, 교통: SLATE, "관광/액티비티": ACCENT, 기타: MUTE };

const PHOTO_CATEGORIES = ["풍경", "음식", "인물", "티켓/영수증", "기타"];
// 일정 코스의 카테고리(관광/밥집/숙소/이동)를 바탕으로 사진 카테고리를 자동으로 추정한다.
function deriveStopPhotoCategory(stopCategory) {
  if (stopCategory === "food") return "음식";
  return "풍경";
}

// ---------------- 사진첩 ----------------
function PhotoAlbumTab({ days, photos, setPhotos }) {
  const [lightbox, setLightbox] = useState(null);

  const stopPhotos = [];
  days.forEach((d) => {
    d.stops.forEach((s) => {
      if (s.photo) stopPhotos.push({ id: s.id, src: s.photo, title: s.title, dayLabel: d.label, source: "stop", category: deriveStopPhotoCategory(s.category) });
    });
  });
  const uploaded = (photos || []).map((p) => ({ ...p, source: "upload", category: p.category || "기타" }));
  const all = [...stopPhotos, ...uploaded];

  async function handleUpload(file) {
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setPhotos([...(photos || []), { id: uid("p"), src: compressed, title: "", category: "기타" }]);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos([...(photos || []), { id: uid("p"), src: reader.result, title: "", category: "기타" }]);
      };
      reader.readAsDataURL(file);
    }
  }
  function removeUploaded(id) {
    setPhotos((photos || []).filter((p) => p.id !== id));
  }
  function recategorize(id, category) {
    setPhotos((photos || []).map((p) => (p.id === id ? { ...p, category } : p)));
  }

  const groups = PHOTO_CATEGORIES.map((cat) => ({ cat, list: all.filter((p) => p.category === cat) })).filter((g) => g.list.length > 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>사진첩</div>
        <label style={{ ...primaryBtn(), cursor: "pointer" }}>
          <ImageIcon size={13} /> 사진 추가
          <input type="file" accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0])} style={{ display: "none" }} />
        </label>
      </div>
      <div style={{ fontSize: 12, color: MUTE, marginBottom: 16 }}>사진 {all.length}장</div>

      {all.length === 0 ? (
        <div style={{ fontSize: 13, color: MUTE }}>아직 사진이 없어요. 위 "사진 추가" 버튼으로 올리거나, 일정 탭에서 코스에 사진을 첨부해보세요.</div>
      ) : (
        groups.map(({ cat, list }) => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.04em", marginBottom: 8 }}>{cat.toUpperCase()} · {list.length}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 }}>
              {list.map((p) => (
                <div key={p.id} style={{ position: "relative" }}>
                  <img
                    src={p.src}
                    alt={p.title}
                    onClick={() => setLightbox(p)}
                    style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 6, border: `1px solid ${LINE}`, cursor: "zoom-in" }}
                  />
                  {p.source === "upload" && (
                    <button
                      onClick={() => removeUploaded(p.id)}
                      style={{ position: "absolute", top: 4, right: 4, width: 18, height: 18, borderRadius: "50%", background: INK, color: PAPER, border: `2px solid ${PAPER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
                      title="삭제"
                    >
                      <X size={10} />
                    </button>
                  )}
                  <div style={{ fontSize: 10, color: MUTE, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.source === "stop" ? `${p.dayLabel} · ${p.title}` : "직접 추가"}
                  </div>
                  {p.source === "upload" && (
                    <select
                      value={p.category}
                      onChange={(e) => recategorize(p.id, e.target.value)}
                      style={{ width: "100%", marginTop: 3, fontSize: 10, padding: "2px 3px", border: `1px solid ${LINE}`, borderRadius: 4, background: PAPER, color: MUTE }}
                    >
                      {PHOTO_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
      <PhotoLightbox item={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

// 코스 추가/수정에 공통으로 쓰는 입력 폼.
function StopForm({ value, onChange, onSubmit, onCancel, submitLabel }) {
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | loading | done | error

  async function lookupCoords() {
    const query = (value.place || value.title || "").trim();
    if (!query) return;
    setGeoStatus("loading");
    try {
      const result = await geocodePlace(query);
      if (result) {
        onChange({ coords: `${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}` });
        setGeoStatus("done");
      } else {
        setGeoStatus("error");
      }
    } catch {
      setGeoStatus("error");
    }
  }

  return (
    <div style={{ padding: 14, background: PANEL, borderRadius: 8 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {STOP_CATEGORIES.map((c) => {
          const CIcon = c.icon;
          const active = value.category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onChange({ category: c.id })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 700,
                color: active ? PAPER : c.color,
                background: active ? c.color : `${c.color}17`,
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              <CIcon size={11} /> {c.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 10 }}>
        <Field label={value.category === "lodging" ? "체크인" : "시간"}>
          <TimeSelect value={value.time} onChange={(t) => onChange({ time: t })} />
          <TimeQuickPicks onPick={(t) => onChange({ time: t })} />
        </Field>
        {value.category === "lodging" && (
          <Field label="체크아웃">
            <TimeSelect value={value.checkOut} onChange={(t) => onChange({ checkOut: t })} />
          </Field>
        )}
        <Field label="이동 출발">
          <TimeSelect value={value.travelStart} onChange={(t) => onChange({ travelStart: t })} />
        </Field>
        <Field label="이동 도착">
          <TimeSelect value={value.travelEnd} onChange={(t) => onChange({ travelEnd: t })} />
        </Field>
        <Field label="이동 수단">
          <select value={value.transportMode || "car"} onChange={(e) => onChange({ transportMode: e.target.value })} style={{ ...inputStyle(88), padding: "8px 6px" }}>
            {TRANSPORT_MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </Field>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <Field label={value.category === "lodging" ? "숙소 이름" : "일정 이름"}>
          <input value={value.title} onChange={(e) => onChange({ title: e.target.value })} style={inputStyle(130)} />
        </Field>
        <Field label="장소 (선택)">
          <input value={value.place} onChange={(e) => onChange({ place: e.target.value })} style={inputStyle(100)} />
        </Field>
        <Field label="좌표 (선택)">
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input value={value.coords} onChange={(e) => onChange({ coords: e.target.value })} style={inputStyle(96)} title="장소 이름으로 자동 검색하거나 직접 입력할 수 있어요" />
            <button
              onClick={lookupCoords}
              disabled={geoStatus === "loading"}
              title="장소 이름으로 좌표 자동 검색"
              style={{ ...iconBtn(false), background: ACCENT_SOFT, borderRadius: 6, padding: "7px 8px" }}
            >
              <Search size={12} color={ACCENT} />
            </button>
          </div>
        </Field>
        <button onClick={onSubmit} style={primaryBtn()}><Plus size={13} /> {submitLabel}</button>
        {onCancel && (
          <button onClick={onCancel} style={{ ...iconBtn(false), padding: "8px 12px", fontSize: 12, fontWeight: 600 }}>
            취소
          </button>
        )}
      </div>
      {geoStatus === "loading" && <span style={{ fontSize: 11, color: MUTE, display: "block", marginTop: 6 }}>좌표 찾는 중…</span>}
      {geoStatus === "error" && <span style={{ fontSize: 11, color: WARN, display: "block", marginTop: 6 }}>좌표를 못 찾았어요. 직접 입력해주세요.</span>}
      {geoStatus === "done" && <span style={{ fontSize: 11, color: ACCENT, display: "block", marginTop: 6 }}>좌표를 찾았어요 ✓</span>}
    </div>
  );
}

// 여행 시작일 + 날짜 순번으로 그 날의 날짜를 계산하고, 그 날 코스 중 좌표가 있는 첫 곳 기준으로 날씨를 보여준다.
function WeatherBadge({ tripStartDate, dayIndex, stops }) {
  const [state, setState] = useState({ status: "idle" }); // idle | loading | done | error | unavailable

  const stopWithCoords = (stops || []).find((s) => typeof s.lat === "number" && typeof s.lng === "number");
  const dateStr = tripStartDate && dayIndex >= 0 ? addDaysToDateStr(tripStartDate, dayIndex) : null;

  useEffect(() => {
    if (!dateStr || !stopWithCoords) {
      setState({ status: "unavailable" });
      return;
    }
    // 날씨 예보는 보통 앞으로 약 2주 정도만 제공된다.
    const daysAhead = Math.round((new Date(dateStr) - new Date(new Date().toDateString())) / 86400000);
    if (daysAhead < 0 || daysAhead > 14) {
      setState({ status: "unavailable" });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    fetchDailyWeather(stopWithCoords.lat, stopWithCoords.lng, dateStr)
      .then((w) => {
        if (cancelled) return;
        if (w) setState({ status: "done", weather: w });
        else setState({ status: "unavailable" });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr, stopWithCoords?.lat, stopWithCoords?.lng]);

  if (state.status === "idle" || state.status === "unavailable") {
    return !tripStartDate ? (
      <span style={{ fontSize: 11, color: MUTE }}>여행 시작일을 등록하면 날씨를 볼 수 있어요</span>
    ) : !stopWithCoords ? (
      <span style={{ fontSize: 11, color: MUTE }}>코스에 좌표를 넣으면 날씨를 볼 수 있어요</span>
    ) : null;
  }
  if (state.status === "loading") return <span style={{ fontSize: 11, color: MUTE }}>날씨 확인 중…</span>;
  if (state.status === "error") return <span style={{ fontSize: 11, color: MUTE }}>날씨를 불러오지 못했어요</span>;

  const { emoji, label } = describeWeatherCode(state.weather.code);
  return (
    <span style={{ fontSize: 12, color: MUTE, display: "flex", alignItems: "center", gap: 4 }}>
      {emoji} {label} {state.weather.min}° / {state.weather.max}°
    </span>
  );
}

// ---------------- 일정 ----------------
function ItineraryTab({ days, setDays, tripStartDate, tripName }) {
  const [activeDay, setActiveDay] = useState(days[0]?.id);
  const [draft, setDraft] = useState({ time: "", checkOut: "", title: "", place: "", coords: "", travelStart: "", travelEnd: "", transportMode: "car", category: "sight" });
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { src, title } | null
  const [editingStopId, setEditingStopId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  useEffect(() => {
    if (!days.find((d) => d.id === activeDay)) setActiveDay(days[0]?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const current = days.find((d) => d.id === activeDay);

  function addDay() {
    const nd = { id: uid("d"), label: `${days.length + 1}일차`, date: "", stops: [] };
    setDays([...days, nd]);
    setActiveDay(nd.id);
  }
  function removeDay(id) {
    const rest = days.filter((d) => d.id !== id);
    setDays(rest);
    if (activeDay === id && rest.length) setActiveDay(rest[0].id);
  }
  function updateDayMeta(id, field, value) {
    setDays(days.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }
  function addStop() {
    if (!draft.title.trim()) return;
    let lat = null, lng = null;
    if (draft.coords.trim()) {
      const parts = draft.coords.split(",").map((v) => parseFloat(v.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) [lat, lng] = parts;
    }
    const stop = {
      id: uid("s"),
      time: draft.time || "--:--",
      title: draft.title,
      place: draft.place,
      note: "",
      lat,
      lng,
      category: draft.category,
      checkOut: draft.category === "lodging" ? draft.checkOut || "" : "",
      travelStart: draft.travelStart || null,
      travelEnd: draft.travelEnd || null,
      transportMode: draft.transportMode || "car",
    };
    setDays(days.map((d) => (d.id === activeDay ? { ...d, stops: [...d.stops, stop].sort((a, b) => a.time.localeCompare(b.time)) } : d)));
    setDraft({ time: "", checkOut: "", title: "", place: "", coords: "", travelStart: "", travelEnd: "", transportMode: "car", category: "sight" });
  }
  function startEdit(s) {
    setEditingStopId(s.id);
    setEditDraft({
      category: s.category,
      time: s.time === "--:--" ? "" : s.time,
      checkOut: s.checkOut || "",
      title: s.title,
      place: s.place || "",
      coords: s.lat != null && s.lng != null ? `${s.lat}, ${s.lng}` : "",
      travelStart: s.travelStart || "",
      travelEnd: s.travelEnd || "",
      transportMode: s.transportMode || "car",
    });
  }
  function cancelEdit() {
    setEditingStopId(null);
    setEditDraft(null);
  }
  function saveEdit() {
    if (!editDraft.title.trim()) return;
    let lat = null, lng = null;
    if (editDraft.coords.trim()) {
      const parts = editDraft.coords.split(",").map((v) => parseFloat(v.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) [lat, lng] = parts;
    }
    setDays(
      days.map((d) =>
        d.id === activeDay
          ? {
              ...d,
              stops: d.stops
                .map((s) =>
                  s.id === editingStopId
                    ? {
                        ...s,
                        time: editDraft.time || "--:--",
                        title: editDraft.title,
                        place: editDraft.place,
                        lat,
                        lng,
                        category: editDraft.category,
                        checkOut: editDraft.category === "lodging" ? editDraft.checkOut || "" : "",
                        travelStart: editDraft.travelStart || null,
                        travelEnd: editDraft.travelEnd || null,
                        transportMode: editDraft.transportMode || "car",
                      }
                    : s
                )
                .sort((a, b) => a.time.localeCompare(b.time)),
            }
          : d
      )
    );
    setEditingStopId(null);
    setEditDraft(null);
  }
  function removeStop(stopId) {
    setDays(days.map((d) => (d.id === activeDay ? { ...d, stops: d.stops.filter((s) => s.id !== stopId) } : d)));
  }
  function updateStop(stopId, field, value) {
    setDays(days.map((d) => (d.id === activeDay ? { ...d, stops: d.stops.map((s) => (s.id === stopId ? { ...s, [field]: value } : s)) } : d)));
  }
  async function handlePhotoUpload(stopId, file) {
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      updateStop(stopId, "photo", compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => updateStop(stopId, "photo", reader.result);
      reader.readAsDataURL(file);
    }
  }
  function moveStop(stopId, dir) {
    setDays(
      days.map((d) => {
        if (d.id !== activeDay) return d;
        const idx = d.stops.findIndex((s) => s.id === stopId);
        const swapIdx = idx + dir;
        if (swapIdx < 0 || swapIdx >= d.stops.length) return d;
        const arr = [...d.stops];
        [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
        return { ...d, stops: arr };
      })
    );
  }

  return (
    <div style={{ display: "flex", gap: 24 }} className="tp-stack">
      <div style={{ width: 140, flexShrink: 0 }} className="tp-day-sidebar">
        {days.map((d) => (
          <div
            key={d.id}
            onClick={() => setActiveDay(d.id)}
            style={{
              padding: "10px 14px",
              cursor: "pointer",
              borderLeft: d.id === activeDay ? `2px solid ${ACCENT}` : "2px solid transparent",
              background: d.id === activeDay ? PANEL : "transparent",
              marginBottom: 2,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: d.id === activeDay ? 700 : 500, color: d.id === activeDay ? INK : "#65686F" }}>{d.label}</div>
            <div style={{ fontSize: 11, color: MUTE, marginTop: 2 }}>{d.date || "날짜 미정"}</div>
          </div>
        ))}
        <button onClick={addDay} className="tp-day-addbtn" style={{ width: "100%", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", fontSize: 12, fontWeight: 600, color: ACCENT, background: ACCENT_SOFT, border: "none", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap" }}>
          <Plus size={13} /> 날짜 추가
        </button>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {current ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <input value={current.label} onChange={(e) => updateDayMeta(current.id, "label", e.target.value)} style={{ fontSize: 20, fontWeight: 700, border: "none", background: "transparent", outline: "none", color: INK, width: "60%" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                {current.stops.length > 0 && (
                  <button
                    onClick={() => shareItineraryImage(current, tripName)}
                    style={{ display: "flex", alignItems: "center", gap: 5, border: "none", background: "none", color: ACCENT, cursor: "pointer", fontSize: 12, fontWeight: 600, padding: 0 }}
                    title="이 날 일정을 이미지로 공유"
                  >
                    <Share2 size={13} /> 이미지로 공유
                  </button>
                )}
                {days.length > 1 && (
                  <button onClick={() => removeDay(current.id)} style={{ border: "none", background: "none", color: WARN, cursor: "pointer", fontSize: 12 }}>삭제</button>
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <input value={current.date} onChange={(e) => updateDayMeta(current.id, "date", e.target.value)} placeholder="날짜 입력" style={{ fontSize: 13, color: MUTE, border: "none", background: "transparent", outline: "none", width: "auto", flexShrink: 0 }} />
              <WeatherBadge tripStartDate={tripStartDate} dayIndex={days.findIndex((d) => d.id === activeDay)} stops={current.stops} />
            </div>
            <div style={{ borderLeft: `1px solid ${LINE}`, marginLeft: 6 }}>
              {current.stops.length === 0 && <div style={{ paddingLeft: 24, paddingBottom: 24, fontSize: 13, color: MUTE }}>아직 일정이 없어요.</div>}
              {current.stops.map((s, i) => {
                const cat = getCategory(s.category);
                const CatIcon = cat.icon;
                const TransportIcon = getTransportMode(s.transportMode).icon;
                return (
                  <div key={s.id} style={{ position: "relative", paddingLeft: 24, paddingBottom: 24 }}>
                    {i > 0 && (s.travelStart || s.travelEnd) ? (
                      <div style={{ position: "relative", paddingLeft: 24, marginBottom: 12, minHeight: 14, display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ position: "absolute", left: -3, top: "50%", transform: "translateY(-50%)", width: 5, height: 5, borderRadius: "50%", background: LINE, border: `1px solid ${PAPER}` }} />
                        <TransportIcon size={10} color={MUTE} />
                        <span style={{ fontSize: 11, color: MUTE }}>
                          {getTransportMode(s.transportMode).label} · {s.travelStart && s.travelEnd
                            ? `${s.travelStart} 출발 → ${s.travelEnd} 도착${(() => {
                                const m = minutesBetween(s.travelStart, s.travelEnd);
                                return m != null ? ` · ${m}분` : "";
                              })()}`
                            : s.travelStart
                            ? `${s.travelStart} 출발`
                            : `${s.travelEnd} 도착`}
                        </span>
                      </div>
                    ) : null}
                    <div style={{ position: "absolute", left: -5, top: 3, width: 9, height: 9, borderRadius: cat.id === "lodging" ? 2 : "50%", background: cat.color, border: `2px solid ${PAPER}` }} />
                    {editingStopId === s.id ? (
                      <StopForm
                        value={editDraft}
                        onChange={(patch) => setEditDraft((d) => ({ ...d, ...patch }))}
                        onSubmit={saveEdit}
                        onCancel={cancelEdit}
                        submitLabel="저장"
                      />
                    ) : (
                      <>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, display: "flex", alignItems: "center", gap: 3, background: `${cat.color}17`, padding: "2px 6px", borderRadius: 4 }}>
                              <CatIcon size={10} /> {cat.label}
                            </span>
                            {cat.id === "lodging" ? (
                              <span style={{ fontSize: 12, color: MUTE, fontWeight: 600 }}>
                                체크인 {s.time}{s.checkOut && ` · 체크아웃 ${s.checkOut}`}
                              </span>
                            ) : (
                              <span style={{ fontSize: 12, color: MUTE, fontWeight: 600 }}>
                                <Clock size={10} style={{ marginRight: 2, verticalAlign: -1 }} />{s.time}
                              </span>
                            )}
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</span>
                          </div>
                          <div style={{ display: "flex", gap: 2, alignItems: "center", flexShrink: 0 }}>
                            <label style={{ ...iconBtn(false), cursor: "pointer", display: "flex" }} title="사진 첨부">
                              <ImageIcon size={13} />
                              <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(s.id, e.target.files?.[0])} style={{ display: "none" }} />
                            </label>
                            <button onClick={() => startEdit(s)} style={iconBtn(false)} title="수정"><Pencil size={13} /></button>
                            <button onClick={() => moveStop(s.id, -1)} disabled={i === 0} style={iconBtn(i === 0)}><ChevronUp size={13} /></button>
                            <button onClick={() => moveStop(s.id, 1)} disabled={i === current.stops.length - 1} style={iconBtn(i === current.stops.length - 1)}><ChevronDown size={13} /></button>
                            <button onClick={() => removeStop(s.id)} style={iconBtn(false)}><Trash2 size={13} /></button>
                          </div>
                        </div>
                        {s.place && <div style={{ fontSize: 12, color: "#65686F", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} /> {s.place}</div>}
                      </>
                    )}
                    {s.note || editingNoteId === s.id ? (
                      <input
                        autoFocus={editingNoteId === s.id && !s.note}
                        value={s.note || ""}
                        onChange={(e) => updateStop(s.id, "note", e.target.value)}
                        onFocus={() => setEditingNoteId(s.id)}
                        onBlur={() => setEditingNoteId(null)}
                        placeholder="메모 입력"
                        style={{ width: "100%", marginTop: 6, padding: "4px 0", fontSize: 12, color: "#65686F", border: "none", borderBottom: `1px dashed ${LINE}`, background: "transparent", outline: "none" }}
                      />
                    ) : (
                      <button
                        onClick={() => setEditingNoteId(s.id)}
                        style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: MUTE, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        <Plus size={10} /> 메모 추가
                      </button>
                    )}
                    {s.photo && (
                      <div style={{ position: "relative", display: "inline-block", marginTop: 8 }}>
                        <img
                          src={s.photo}
                          alt={s.title}
                          onClick={() => setLightbox({ src: s.photo, title: s.title })}
                          style={{ width: 88, height: 88, objectFit: "cover", borderRadius: 6, border: `1px solid ${LINE}`, cursor: "zoom-in" }}
                        />
                        <button
                          onClick={() => updateStop(s.id, "photo", null)}
                          style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: INK, color: PAPER, border: `2px solid ${PAPER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
                          title="사진 삭제"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <NaverMapPanel stops={current.stops} dayLabel={current.label} />

            <StopForm value={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} onSubmit={addStop} submitLabel="추가" />
          </>
        ) : (
          <div style={{ color: MUTE, fontSize: 13 }}>날짜를 추가해보세요.</div>
        )}
      </div>

      <PhotoLightbox item={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

// ---------------- 네이버 지도 패널 ----------------
function NaverMapPanel({ stops, dayLabel }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [clientId, setClientId] = useState("");
  const [clientIdInput, setClientIdInput] = useState("");
  const [scriptStatus, setScriptStatus] = useState("idle");
  const [storageChecked, setStorageChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await window.storage.get("naver_map_client_id");
        if (!cancelled && result?.value) {
          setClientId(result.value);
          setClientIdInput(result.value);
        }
      } catch {
        // no stored value
      } finally {
        if (!cancelled) setStorageChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function saveClientId() {
    const id = clientIdInput.trim();
    if (!id) return;
    setClientId(id);
    setScriptStatus("idle");
    try {
      await window.storage.set("naver_map_client_id", id);
    } catch {
      // continue for this session even if save fails
    }
  }

  useEffect(() => {
    if (!clientId) return;
    if (window.naver?.maps) {
      setScriptStatus("ready");
      return;
    }
    setScriptStatus("loading");
    const existing = document.getElementById("naver-maps-sdk");
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.id = "naver-maps-sdk";
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`;
    script.onload = () => setScriptStatus("ready");
    script.onerror = () => setScriptStatus("error");
    document.head.appendChild(script);
  }, [clientId]);

  useEffect(() => {
    if (scriptStatus !== "ready" || !mapRef.current || !window.naver?.maps) return;
    const { naver } = window;
    const withCoords = stops.filter((s) => typeof s.lat === "number" && typeof s.lng === "number");
    const center = withCoords.length ? new naver.maps.LatLng(withCoords[0].lat, withCoords[0].lng) : new naver.maps.LatLng(34.7604, 127.6622);

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new naver.maps.Map(mapRef.current, { center, zoom: 12 });
    } else {
      mapInstanceRef.current.setCenter(center);
    }

    (mapInstanceRef.current.__overlays || []).forEach((o) => o.setMap(null));
    const overlays = [];

    withCoords.forEach((s, i) => {
      const cat = getCategory(s.category);
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(s.lat, s.lng),
        map: mapInstanceRef.current,
        title: s.title,
        icon: {
          content: `<div style="background:${cat.color};color:#fff;font-size:11px;font-weight:700;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)">${i + 1}</div>`,
          anchor: new naver.maps.Point(10, 10),
        },
      });
      overlays.push(marker);
    });

    if (withCoords.length >= 2) {
      const path = withCoords.map((s) => new naver.maps.LatLng(s.lat, s.lng));
      const polyline = new naver.maps.Polyline({ map: mapInstanceRef.current, path, strokeColor: ACCENT, strokeWeight: 3, strokeOpacity: 0.85 });
      overlays.push(polyline);
    }
    mapInstanceRef.current.__overlays = overlays;
  }, [scriptStatus, stops]);

  const withCoordsCount = stops.filter((s) => typeof s.lat === "number" && typeof s.lng === "number").length;

  if (!storageChecked) return null;

  if (!clientId) {
    return (
      <div style={{ margin: "6px 0 16px", padding: 16, background: PANEL, borderRadius: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
          <Map size={14} /> 네이버 지도 연결하기
        </div>
        <div style={{ fontSize: 12, color: MUTE, marginBottom: 10, lineHeight: 1.5 }}>
          네이버 지도를 이 화면에 띄우려면 네이버 클라우드 플랫폼에서 발급받은 Client ID가 필요해요.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="Naver Maps Client ID" value={clientIdInput} onChange={(e) => setClientIdInput(e.target.value)} style={inputStyle(220)} />
          <button onClick={saveClientId} style={primaryBtn()}>연결</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: "6px 0 16px" }}>
      {scriptStatus === "error" && <div style={{ fontSize: 12, color: WARN, marginBottom: 6 }}>지도를 불러오지 못했어요. Client ID를 확인해주세요.</div>}
      <div ref={mapRef} style={{ width: "100%", height: 260, borderRadius: 8, border: `1px solid ${LINE}`, background: PANEL }} />
      <div style={{ fontSize: 11, color: MUTE, marginTop: 6, display: "flex", justifyContent: "space-between" }}>
        <span>{dayLabel} · 좌표가 있는 코스 {withCoordsCount}곳 표시 중</span>
        {stops.length >= 2 && (
          <a href={buildMapRouteUrl(stops)} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, textDecoration: "none" }}>구글 지도로 길찾기 열기 →</a>
        )}
      </div>
    </div>
  );
}

// ---------------- 예산 ----------------
function BudgetTab({ members, setMembers, expenses, setExpenses, payments, setPayments, tripName }) {
  const [draft, setDraft] = useState({ title: "", amount: "", payer: members[0] || "", category: EXPENSE_CATEGORIES[0], excludeFromSplit: false });
  const [memberDraft, setMemberDraft] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editExpenseDraft, setEditExpenseDraft] = useState(null);
  const [paymentDraft, setPaymentDraft] = useState({ from: members[0] || "", to: members[1] || "", amount: "" });

  useEffect(() => {
    if (!draft.payer && members[0]) setDraft((d) => ({ ...d, payer: members[0] }));
    if (!paymentDraft.from && members[0]) setPaymentDraft((d) => ({ ...d, from: members[0], to: members[1] || members[0] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members]);

  const splitExpenses = expenses.filter((e) => !e.excludeFromSplit);
  const treatExpenses = expenses.filter((e) => e.excludeFromSplit);
  const total = splitExpenses.reduce((sum, e) => sum + e.amount, 0);
  const treatTotal = treatExpenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = members.length ? total / members.length : 0;
  const paidByMember = Object.fromEntries(members.map((m) => [m, 0]));
  splitExpenses.forEach((e) => { paidByMember[e.payer] = (paidByMember[e.payer] || 0) + e.amount; });

  // 이미 직접 주고받은 송금 기록을 반영해 남은 정산액을 다시 계산한다.
  const adjustedPaidByMember = { ...paidByMember };
  payments.forEach((p) => {
    adjustedPaidByMember[p.from] = (adjustedPaidByMember[p.from] || 0) + p.amount;
    adjustedPaidByMember[p.to] = (adjustedPaidByMember[p.to] || 0) - p.amount;
  });

  function addMember() {
    const name = memberDraft.trim();
    if (!name || members.includes(name)) return;
    setMembers([...members, name]);
    setMemberDraft("");
  }
  function removeMember(name) {
    setMembers(members.filter((m) => m !== name));
  }
  function addExpense() {
    const amt = Number(draft.amount);
    if (!draft.title.trim() || !amt || !draft.payer) return;
    setExpenses([...expenses, { id: uid("e"), title: draft.title, amount: amt, payer: draft.payer, category: draft.category, excludeFromSplit: draft.excludeFromSplit }]);
    setDraft({ title: "", amount: "", payer: draft.payer, category: draft.category, excludeFromSplit: false });
  }
  function removeExpense(id) {
    setExpenses(expenses.filter((e) => e.id !== id));
  }
  function startEditExpense(e) {
    setEditingExpenseId(e.id);
    setEditExpenseDraft({ title: e.title, amount: String(e.amount), payer: e.payer, category: e.category || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1], excludeFromSplit: !!e.excludeFromSplit });
  }
  function cancelEditExpense() {
    setEditingExpenseId(null);
    setEditExpenseDraft(null);
  }
  function saveEditExpense() {
    const amt = Number(editExpenseDraft.amount);
    if (!editExpenseDraft.title.trim() || !amt) return;
    setExpenses(expenses.map((e) => (e.id === editingExpenseId ? { ...e, title: editExpenseDraft.title, amount: amt, payer: editExpenseDraft.payer, category: editExpenseDraft.category, excludeFromSplit: editExpenseDraft.excludeFromSplit } : e)));
    setEditingExpenseId(null);
    setEditExpenseDraft(null);
  }
  function addPayment() {
    const amt = Number(paymentDraft.amount);
    if (!paymentDraft.from || !paymentDraft.to || paymentDraft.from === paymentDraft.to || !amt) return;
    setPayments([...payments, { id: uid("pay"), from: paymentDraft.from, to: paymentDraft.to, amount: amt }]);
    setPaymentDraft({ ...paymentDraft, amount: "" });
  }
  function removePayment(id) {
    setPayments(payments.filter((p) => p.id !== id));
  }

  return (
    <div style={{ display: "flex", gap: 28 }} className="tp-stack">
      <div style={{ flex: 1.3, minWidth: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>멤버</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
          {members.map((m) => (
            <span key={m} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: ACCENT_SOFT, color: ACCENT, borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
              {m}
              <X size={11} style={{ cursor: "pointer" }} onClick={() => removeMember(m)} />
            </span>
          ))}
          <input placeholder="멤버 이름 + Enter" value={memberDraft} onChange={(e) => setMemberDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMember()} style={inputStyle(120)} />
        </div>

        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>지출 내역</div>
        {expenses.length === 0 && <div style={{ fontSize: 12, color: MUTE, marginBottom: 10 }}>아직 지출 내역이 없어요.</div>}
        {expenses.map((e) =>
          editingExpenseId === e.id ? (
            <div key={e.id} style={{ padding: "10px 0", borderBottom: `1px solid ${LINE}` }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                <input value={editExpenseDraft.title} onChange={(ev) => setEditExpenseDraft({ ...editExpenseDraft, title: ev.target.value })} style={inputStyle(110)} autoFocus />
                <input type="number" value={editExpenseDraft.amount} onChange={(ev) => setEditExpenseDraft({ ...editExpenseDraft, amount: ev.target.value })} style={inputStyle(80)} />
                <select value={editExpenseDraft.payer} onChange={(ev) => setEditExpenseDraft({ ...editExpenseDraft, payer: ev.target.value })} style={{ ...inputStyle(80), padding: "8px 6px" }}>
                  {members.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={editExpenseDraft.category} onChange={(ev) => setEditExpenseDraft({ ...editExpenseDraft, category: ev.target.value })} style={{ ...inputStyle(90), padding: "8px 6px" }}>
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={saveEditExpense} style={{ ...primaryBtn(), padding: "6px 10px", fontSize: 12 }}>저장</button>
                <button onClick={cancelEditExpense} style={{ ...iconBtn(false), padding: "6px 10px", fontSize: 12 }}>취소</button>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: MUTE, cursor: "pointer", width: "fit-content" }}>
                <input
                  type="checkbox"
                  checked={editExpenseDraft.excludeFromSplit}
                  onChange={(ev) => setEditExpenseDraft({ ...editExpenseDraft, excludeFromSplit: ev.target.checked })}
                  style={{ accentColor: ACCENT }}
                />
                정산에서 제외 ({editExpenseDraft.payer}가 쐈어요)
              </label>
            </div>
          ) : (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${LINE}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{e.title}</div>
                <div style={{ fontSize: 11, color: MUTE, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{e.payer} 결제</span>
                  <span style={{ color: EXPENSE_CATEGORY_COLORS[e.category] || MUTE, fontWeight: 700 }}>{e.category || "기타"}</span>
                  {e.excludeFromSplit && (
                    <span style={{ color: AMBER, fontWeight: 700, background: `${AMBER}17`, padding: "1px 6px", borderRadius: 8 }}>
                      {e.payer}가 쏨 · 정산 제외
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{e.amount.toLocaleString()}원</span>
                <button onClick={() => startEditExpense(e)} style={iconBtn(false)} title="수정"><Pencil size={13} /></button>
                <button onClick={() => removeExpense(e.id)} style={iconBtn(false)}><Trash2 size={13} /></button>
              </div>
            </div>
          )
        )}

        {members.length === 0 ? (
          <div style={{ marginTop: 14, fontSize: 12, color: MUTE }}>지출을 추가하려면 먼저 멤버를 추가해주세요.</div>
        ) : (
          <div style={{ marginTop: 14, padding: 14, background: PANEL, borderRadius: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
              <input placeholder="항목" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} style={inputStyle(120)} />
              <input placeholder="금액" type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} style={inputStyle(90)} />
              <select value={draft.payer} onChange={(e) => setDraft({ ...draft, payer: e.target.value })} style={{ ...inputStyle(90), padding: "8px 6px" }}>
                {members.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} style={{ ...inputStyle(100), padding: "8px 6px" }}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={addExpense} style={primaryBtn()}><Plus size={13} /> 추가</button>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: MUTE, cursor: "pointer", width: "fit-content" }}>
              <input
                type="checkbox"
                checked={draft.excludeFromSplit}
                onChange={(e) => setDraft({ ...draft, excludeFromSplit: e.target.checked })}
                style={{ accentColor: ACCENT }}
              />
              정산에서 제외 (엔빵 안 하고 {draft.payer || "이 사람"}이 그냥 쐈어요)
            </label>
          </div>
        )}

        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 6 }}>송금 기록</div>
        <div style={{ fontSize: 12, color: MUTE, marginBottom: 14 }}>이미 개인적으로 주고받은 돈을 적어두면, 오른쪽 정산 결과에서 자동으로 빠져요.</div>
        {payments.length === 0 && <div style={{ fontSize: 12, color: MUTE, marginBottom: 10 }}>아직 기록된 송금이 없어요.</div>}
        {payments.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${LINE}` }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{p.from}</span>
            <ArrowRight size={12} color={MUTE} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{p.to}</span>
            <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{p.amount.toLocaleString()}원</span>
            <button onClick={() => removePayment(p.id)} style={iconBtn(false)}><Trash2 size={12} /></button>
          </div>
        ))}

        {members.length >= 2 && (
          <div style={{ marginTop: 10, padding: 14, background: PANEL, borderRadius: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select value={paymentDraft.from} onChange={(e) => setPaymentDraft({ ...paymentDraft, from: e.target.value })} style={{ ...inputStyle(80), padding: "8px 6px" }}>
              {members.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <ArrowRight size={13} color={MUTE} />
            <select value={paymentDraft.to} onChange={(e) => setPaymentDraft({ ...paymentDraft, to: e.target.value })} style={{ ...inputStyle(80), padding: "8px 6px" }}>
              {members.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <input placeholder="금액" type="number" value={paymentDraft.amount} onChange={(e) => setPaymentDraft({ ...paymentDraft, amount: e.target.value })} style={inputStyle(90)} />
            <button onClick={addPayment} style={primaryBtn()}><Plus size={13} /> 기록</button>
          </div>
        )}
      </div>

      <div style={{ width: 220, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: MUTE, fontWeight: 600 }}>총 지출</div>
          {total > 0 && (
            <button
              onClick={() =>
                shareBudgetImage({
                  tripName,
                  total,
                  perPerson,
                  categoriesWithSum: EXPENSE_CATEGORIES.map((cat) => ({
                    cat,
                    sum: splitExpenses.filter((e) => (e.category || "기타") === cat).reduce((s, e) => s + e.amount, 0),
                  })).filter((c) => c.sum > 0),
                  transactions: settleDebts(members, adjustedPaidByMember, perPerson),
                })
              }
              style={{ display: "flex", alignItems: "center", gap: 4, border: "none", background: "none", color: ACCENT, cursor: "pointer", fontSize: 11, fontWeight: 600, padding: 0 }}
              title="예산 정산을 이미지로 공유"
            >
              <Share2 size={12} /> 이미지로 공유
            </button>
          )}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{total.toLocaleString()}원</div>
        <div style={{ fontSize: 12, color: MUTE, marginBottom: treatTotal > 0 ? 4 : 18 }}>1인당 {Math.round(perPerson).toLocaleString()}원</div>
        {treatTotal > 0 && (
          <div style={{ fontSize: 11, color: AMBER, marginBottom: 18 }}>
            (별도로 쏜 금액 {treatTotal.toLocaleString()}원은 정산에서 빠졌어요)
          </div>
        )}

        {total > 0 && (
          <>
            <div style={{ fontSize: 12, color: MUTE, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
              <PieChart size={12} /> 카테고리별 지출
            </div>
            {EXPENSE_CATEGORIES.map((cat) => {
              const sum = splitExpenses.filter((e) => (e.category || "기타") === cat).reduce((s, e) => s + e.amount, 0);
              if (sum === 0) return null;
              const pct = Math.round((sum / total) * 100);
              const color = EXPENSE_CATEGORY_COLORS[cat] || MUTE;
              return (
                <div key={cat} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: INK, fontWeight: 600 }}>{cat}</span>
                    <span style={{ color: MUTE }}>{pct}% · {sum.toLocaleString()}원</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: PANEL, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
            <div style={{ height: 18 }} />
          </>
        )}

        <div style={{ fontSize: 12, color: MUTE, fontWeight: 600, marginBottom: 8 }}>남은 정산</div>
        {settleDebts(members, adjustedPaidByMember, perPerson).length === 0 && <div style={{ fontSize: 12, color: MUTE }}>정산할 내역이 없어요.</div>}
        {settleDebts(members, adjustedPaidByMember, perPerson).map((t, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0", fontSize: 13, borderBottom: `1px solid ${LINE}` }}>
            <span style={{ fontWeight: 700, color: WARN }}>{t.from}</span>
            <ArrowRight size={12} color={MUTE} />
            <span style={{ fontWeight: 700, color: ACCENT }}>{t.to}</span>
            <span style={{ marginLeft: "auto", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{Math.round(t.amount).toLocaleString()}원</span>
          </div>
        ))}
        {payments.length > 0 && (
          <div style={{ fontSize: 11, color: MUTE, marginTop: 10 }}>송금 기록 {payments.length}건이 이미 반영됐어요.</div>
        )}
      </div>
    </div>
  );
}

// ---------------- 준비물 ----------------
function ChecklistTab({ items, setItems, members }) {
  const [draft, setDraft] = useState("");
  const [category, setCategory] = useState(CHECKLIST_CATEGORIES[0]);
  const assigneeOptions = ["공용", ...(members || [])];
  const [assignee, setAssignee] = useState("공용");

  function toggle(id) {
    setItems(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }
  function addItem() {
    if (!draft.trim()) return;
    setItems([...items, { id: uid("c"), label: draft, category, assignedTo: assignee, done: false }]);
    setDraft("");
  }
  function removeItem(id) {
    setItems(items.filter((i) => i.id !== id));
  }
  function reassign(id, assignedTo) {
    setItems(items.map((i) => (i.id === id ? { ...i, assignedTo } : i)));
  }

  const doneCount = items.filter((i) => i.done).length;
  const grouped = CHECKLIST_CATEGORIES.map((cat) => ({ cat, list: items.filter((i) => i.category === cat) })).filter((g) => g.list.length > 0);
  const uncategorized = items.filter((i) => !CHECKLIST_CATEGORIES.includes(i.category));

  return (
    <div style={{ maxWidth: 460 }}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>준비물 체크리스트</div>
      <div style={{ fontSize: 12, color: MUTE, marginBottom: 16 }}>{doneCount} / {items.length} 완료</div>

      {items.length === 0 && <div style={{ fontSize: 12, color: MUTE, marginBottom: 12 }}>아직 준비물이 없어요.</div>}

      {[...grouped, ...(uncategorized.length ? [{ cat: "기타", list: uncategorized }] : [])].map(({ cat, list }) => (
        <div key={cat} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.04em", marginBottom: 6 }}>{cat.toUpperCase()}</div>
          {list.map((i) => {
            const assignedTo = i.assignedTo || "공용";
            return (
              <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${LINE}` }}>
                <div
                  onClick={() => toggle(i.id)}
                  style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${i.done ? ACCENT : LINE}`, background: i.done ? ACCENT : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}
                >
                  {i.done && <Check size={11} color={PAPER} />}
                </div>
                <span onClick={() => toggle(i.id)} style={{ fontSize: 13, flex: 1, color: i.done ? MUTE : INK, textDecoration: i.done ? "line-through" : "none", cursor: "pointer" }}>
                  {i.label}
                </span>
                {assigneeOptions.length > 1 && (
                  <select
                    value={assignedTo}
                    onChange={(e) => reassign(i.id, e.target.value)}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: assignedTo === "공용" ? MUTE : ACCENT,
                      background: assignedTo === "공용" ? PANEL : ACCENT_SOFT,
                      border: "none",
                      borderRadius: 10,
                      padding: "3px 6px",
                    }}
                  >
                    {assigneeOptions.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                )}
                <button onClick={() => removeItem(i.id)} style={iconBtn(false)}><Trash2 size={12} /></button>
              </div>
            );
          })}
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle(90), padding: "8px 6px" }}>
          {CHECKLIST_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {assigneeOptions.length > 1 && (
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)} style={{ ...inputStyle(90), padding: "8px 6px" }}>
            {assigneeOptions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
        <input placeholder="준비물 추가" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} style={inputStyle(160)} />
        <button onClick={addItem} style={primaryBtn()}><Plus size={13} /> 추가</button>
      </div>
    </div>
  );
}
