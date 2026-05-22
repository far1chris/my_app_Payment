const fs = require('fs');

const maleFirstnames = ["สมชาย", "สมศักดิ์", "วิชัย", "มานะ", "อภิชาติ", "ณัฐพล", "ธนพล", "วีรชัย", "เกียรติ", "สุรเดช", "กิตติ", "พัธรนัส", "ประเสริฐ", "นพดล", "ชาญชัย", "อนันต์", "สมบูรณ์", "ธีรเดช", "สกล", "ทวีศักดิ์"];
const femaleFirstnames = ["สมศรี", "จรรยา", "สุภาภรณ์", "กนกวรรณ", "อลิสา", "พิชชาพร", "กมลวรรณ", "พัชรา", "นงลักษณ์", "วันทนา", "วิภาดา", "สุดา", "จงกล", "จรัสศรี", "ลัดดา", "มยุรี", "ศิริพร", "รัตนา", "เพ็ญศรี", "นุชนาถ"];
const lastnames = ["รักไทย", "มณีวรรณ", "แสนดี", "นามวิเศษ", "เจริญสุข", "มีชัย", "คำดี", "แก้วมณี", "บุญมี", "ดวงแก้ว", "ใจดี", "ยอดรัก", "ดีเด่น", "รักเรียน", "มั่นคง", "คำแหง", "เลิศล้ำ", "เจริญวงศ์", "เกียรติทวี", "ศรีสุข", "รุ่งเรือง", "ประสิทธิ์", "โชคดี", "ทองดี", "แก้วใส"];

const modalities = ["XR", "CT", "MRI"];
const examNames = {
  "XR": ["Chest PA Upright", "Chest AP Portable", "KUB", "Skull AP/Lat", "Spine Cervical"],
  "CT": ["CT Brain", "CT Chest", "CT Whole Abdomen", "CT Upper Abdomen", "CT Head"],
  "MRI": ["MRI Spine", "MRI Orbit", "MRI Brain", "MRI Knee"]
};

const xrays = [];
let idCounter = 1;

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addCase(date, priority, status) {
  const isMale = Math.random() > 0.5;
  const firstName = isMale ? randomChoice(maleFirstnames) : randomChoice(femaleFirstnames);
  const lastName = randomChoice(lastnames);
  const name = (isMale ? "นาย " : "นางสาว ") + firstName + " " + lastName;

  const mod = randomChoice(modalities);
  const exam = randomChoice(examNames[mod]);

  const caseStatus = status || (Math.random() > 0.3 ? "Completed" : "In Progress");

  xrays.push({
    "id": idCounter,
    "orderNo": "ORD-" + String(idCounter).padStart(3, '0'),
    "orderDate": date + " " + String(randomInt(8, 16)).padStart(2, '0') + ":" + String(randomInt(0, 59)).padStart(2, '0'),
    "hn": "HN-" + randomInt(10000, 99999),
    "patientName": name,
    "modality": mod,
    "examName": exam,
    "priority": priority,
    "status": caseStatus
  });
  idCounter++;
}

// 1. March 27, 2024 -> 3 Urgent, 1 Normal
for (let i = 0; i < 3; i++) addCase("27/03/2024", "Urgent");
for (let i = 0; i < 1; i++) addCase("27/03/2024", "Normal");

// 2. March 28, 2024 -> 5 Urgent, 12 Normal
for (let i = 0; i < 5; i++) addCase("28/03/2024", "Urgent");
for (let i = 0; i < 12; i++) addCase("28/03/2024", "Normal");

// 3. March 29, 2024 -> 8 Urgent, 0 Normal
for (let i = 0; i < 8; i++) addCase("29/03/2024", "Urgent");

// 4. Other March days -> 4 Urgent, 67 Normal (to make March total: 20 Urgent, 80 Normal)
const otherMarchDays = [5, 10, 12, 15, 20, 22, 25].map(d => String(d).padStart(2, '0') + "/03/2024");
for (let i = 0; i < 4; i++) addCase(randomChoice(otherMarchDays), "Urgent");
for (let i = 0; i < 67; i++) addCase(randomChoice(otherMarchDays), "Normal");

// 5. April 3, 2024 -> 2 Urgent, 3 Normal
for (let i = 0; i < 2; i++) addCase("03/04/2024", "Urgent");
for (let i = 0; i < 3; i++) addCase("03/04/2024", "Normal");

const consults = [];
let consultIdCounter = 1;

function addConsult(category, status, method) {
  const isMale = Math.random() > 0.5;
  const firstName = isMale ? randomChoice(maleFirstnames) : randomChoice(femaleFirstnames);
  const lastName = randomChoice(lastnames);
  const name = (isMale ? "นาย " : "นางสาว ") + firstName + " " + lastName;

  consults.push({
    "id": consultIdCounter,
    "patientName": name,
    "hn": "HN-" + randomInt(10000, 99999),
    "category": category,
    "method": method,
    "status": status
  });
  consultIdCounter++;
}

// Generate brain consults (Total 450)
for (let i = 0; i < 80; i++) addConsult("สมอง", "รอตอบรับ", "ส่งต่อเคส");
for (let i = 0; i < 20; i++) addConsult("สมอง", "รอตอบรับ", "Tele Consult");
for (let i = 0; i < 216; i++) addConsult("สมอง", "การนัดสำเร็จ", "ส่งต่อเคส");
for (let i = 0; i < 54; i++) addConsult("สมอง", "การนัดสำเร็จ", "Tele Consult");
for (let i = 0; i < 56; i++) addConsult("สมอง", "ปฏิเสธการนัด", "ส่งต่อเคส");
for (let i = 0; i < 14; i++) addConsult("สมอง", "ปฏิเสธการนัด", "Tele Consult");
for (let i = 0; i < 8; i++) addConsult("สมอง", "ขาดการติดต่อ", "ส่งต่อเคส");
for (let i = 0; i < 2; i++) addConsult("สมอง", "ขาดการติดต่อ", "Tele Consult");

// Generate chest consults (Total 380)
for (let i = 0; i < 96; i++) addConsult("ทรวงอก", "รอตอบรับ", "ส่งต่อเคส");
for (let i = 0; i < 24; i++) addConsult("ทรวงอก", "รอตอบรับ", "Tele Consult");
for (let i = 0; i < 128; i++) addConsult("ทรวงอก", "การนัดสำเร็จ", "ส่งต่อเคส");
for (let i = 0; i < 32; i++) addConsult("ทรวงอก", "การนัดสำเร็จ", "Tele Consult");
for (let i = 0; i < 64; i++) addConsult("ทรวงอก", "ปฏิเสธการนัด", "ส่งต่อเคส");
for (let i = 0; i < 16; i++) addConsult("ทรวงอก", "ปฏิเสธการนัด", "Tele Consult");
for (let i = 0; i < 16; i++) addConsult("ทรวงอก", "ขาดการติดต่อ", "ส่งต่อเคส");
for (let i = 0; i < 4; i++) addConsult("ทรวงอก", "ขาดการติดต่อ", "Tele Consult");

// Generate eye consults (Total 170)
for (let i = 0; i < 32; i++) addConsult("ดวงตา", "รอตอบรับ", "ส่งต่อเคส");
for (let i = 0; i < 8; i++) addConsult("ดวงตา", "รอตอบรับ", "Tele Consult");
for (let i = 0; i < 72; i++) addConsult("ดวงตา", "การนัดสำเร็จ", "ส่งต่อเคส");
for (let i = 0; i < 18; i++) addConsult("ดวงตา", "การนัดสำเร็จ", "Tele Consult");
for (let i = 0; i < 24; i++) addConsult("ดวงตา", "ปฏิเสธการนัด", "ส่งต่อเคส");
for (let i = 0; i < 6; i++) addConsult("ดวงตา", "ปฏิเสธการนัด", "Tele Consult");
for (let i = 0; i < 8; i++) addConsult("ดวงตา", "ขาดการติดต่อ", "ส่งต่อเคส");
for (let i = 0; i < 2; i++) addConsult("ดวงตา", "ขาดการติดต่อ", "Tele Consult");

const db = {
  "xrays": xrays,
  "consults": consults,
  "dashboard": {
    "totalOrders": xrays.length,
    "completed": xrays.filter(x => x.status === "Completed").length,
    "inProgress": xrays.filter(x => x.status === "In Progress").length,
    "cancelled": 1,
    "schedules": [
      { "id": 1, "day": "Tue", "date": 15, "patient": "นาย ทดสอบ ระบบ", "hn": "HN-00100", "time": "11.00 - 12.00 น." },
      { "id": 2, "day": "Wed", "date": 16, "patient": "นาง ใจดี มีสุข", "hn": "HN-00101", "time": "09.00 - 10.00 น." },
      { "id": 3, "day": "Thu", "date": 17, "patient": "นาย สมหมาย จริงใจ", "hn": "HN-00102", "time": "13.00 - 14.00 น." }
    ],
    "consultStats": {
      "waitList": 96,
      "consulting": 4,
      "complete": 84
    },
    "barChart": {
      "labels": ["13 Mon", "14 Tue", "15 Wed", "16 Thu", "17 Fri", "18 Sat", "19 Sun"],
      "data": [65, 59, 80, 81, 56, 55, 40]
    },
    "donutChart": {
      "labels": ["Male", "Female"],
      "data": [350, 450]
    }
  }
};

fs.writeFileSync("mock-api/db.json", JSON.stringify(db, null, 2), "utf-8");
console.log(`Successfully generated ${xrays.length} xray records and ${consults.length} consult records in mock-api/db.json!`);

