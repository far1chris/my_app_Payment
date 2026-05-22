import json
import random

# Thai First Names and Last Names for mock data
male_firstnames = ["สมชาย", "สมศักดิ์", "วิชัย", "มานะ", "อภิชาติ", "ณัฐพล", "ธนพล", "วีรชัย", "เกียรติ", "สุรเดช", "กิตติ", "พัธรนัส", "ประเสริฐ", "นพดล", "ชาญชัย", "อนันต์", "สมบูรณ์", "ธีรเดช", "สกล", "ทวีศักดิ์"]
female_firstnames = ["สมศรี", "จรรยา", "สุภาภรณ์", "กนกวรรณ", "อลิสา", "พิชชาพร", "กมลวรรณ", "พัชรา", "นงลักษณ์", "วันทนา", "วิภาดา", "สุดา", "จงกล", "จรัสศรี", "ลัดดา", "มยุรี", "ศิริพร", "รัตนา", "เพ็ญศรี", "นุชนาถ"]
lastnames = ["รักไทย", "มณีวรรณ", "แสนดี", "นามวิเศษ", "เจริญสุข", "มีชัย", "คำดี", "แก้วมณี", "บุญมี", "ดวงแก้ว", "ใจดี", "ยอดรัก", "ดีเด่น", "รักเรียน", "มั่นคง", "คำแหง", "เลิศล้ำ", "เจริญวงศ์", "เกียรติทวี", "ศรีสุข", "รุ่งเรือง", "ประสิทธิ์", "โชคดี", "ทองดี", "แก้วใส"]

modalities = ["XR", "CT", "MRI"]
exam_names = {
    "XR": ["Chest PA Upright", "Chest AP Portable", "KUB", "Skull AP/Lat", "Spine Cervical"],
    "CT": ["CT Brain", "CT Chest", "CT Whole Abdomen", "CT Upper Abdomen", "CT Head"],
    "MRI": ["MRI Spine", "MRI Orbit", "MRI Brain", "MRI Knee"]
}

xrays = []

id_counter = 1

def add_case(date, priority, status=None):
    global id_counter
    # Determine gender and name
    is_male = random.choice([True, False])
    if is_male:
        name = f"นาย {random.choice(male_firstnames)} {random.choice(lastnames)}"
    else:
        name = f"นางสาว {random.choice(female_firstnames)} {random.choice(lastnames)}"
    
    mod = random.choice(modalities)
    exam = random.choice(exam_names[mod])
    
    if not status:
        status = "Completed" if random.random() > 0.3 else "In Progress"
        
    xrays.append({
        "id": id_counter,
        "orderNo": f"ORD-{id_counter:03d}",
        "orderDate": f"{date} {random.randint(8,16):02d}:{random.randint(0,59):02d}",
        "hn": f"HN-{random.randint(10000, 99999)}",
        "patientName": name,
        "modality": mod,
        "examName": exam,
        "priority": priority,
        "status": status
    })
    id_counter += 1

# Let's populate the cases exactly as required to match the mockup metrics!
# Total March 2024 (มีนาคม 2567) cases = 100
# Urgent = 20, Normal = 80

# 1. Specific day: March 27, 2024 -> 3 Urgent, 1 Normal
for _ in range(3):
    add_case("27/03/2024", "Urgent")
for _ in range(1):
    add_case("27/03/2024", "Normal")

# 2. Specific day: March 28, 2024 -> 5 Urgent, 12 Normal
for _ in range(5):
    add_case("28/03/2024", "Urgent")
for _ in range(12):
    add_case("28/03/2024", "Normal")

# 3. Specific day: March 29, 2024 -> 8 Urgent, 0 Normal
for _ in range(8):
    add_case("29/03/2024", "Urgent")

# 4. Other March days -> 4 Urgent, 67 Normal (to make March total: 20 Urgent, 80 Normal)
other_march_days = [f"{day:02d}/03/2024" for day in [5, 10, 12, 15, 20, 22, 25]]
for _ in range(4):
    add_case(random.choice(other_march_days), "Urgent")
for _ in range(67):
    add_case(random.choice(other_march_days), "Normal")

# 5. Specific day: April 3, 2024 -> 2 Urgent, 3 Normal
for _ in range(2):
    add_case("03/04/2024", "Urgent")
for _ in range(3):
    add_case("03/04/2024", "Normal")

# Write to db.json
db = {
    "xrays": xrays,
    "dashboard": {
        "totalOrders": len(xrays),
        "completed": len([x for x in xrays if x["status"] == "Completed"]),
        "inProgress": len([x for x in xrays if x["status"] == "In Progress"]),
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
}

with open("mock-api/db.json", "w", encoding="utf-8") as f:
    json.dump(db, f, indent=2, ensure_ascii=False)

print(f"Successfully generated {len(xrays)} xray patient records matching stats!")
