# 🏥 Medical Cases Dashboard (Ionic 8 + Angular 18)

## 🛠️ สิ่งที่ต้องเตรียมก่อนเริ่ม (Prerequisites)
ก่อนเริ่มรันโปรเจกต์ กรุณาติดตั้งโปรแกรมและระบบต่อไปนี้:
*   [Node.js](https://nodejs.org/) (แนะนำเวอร์ชัน **20.x** ขึ้นไป)
*   [npm](https://www.npmjs.com/) (ติดตั้งมาพร้อม Node.js)
*   **Ionic CLI** (สำหรับรันภายในเครื่องด้วยคำสั่งของ Ionic)
    ```bash
    npm install -g @ionic/cli
    ```
*   **Docker & Docker Compose** (สำหรับติดตั้งแบบ Containerized สะดวกรวดเร็วในปุ่มเดียว)

---

## 🚀 วิธีการรันโปรเจกต์ (How to Run)

เลือกใช้วิธีใดวิธีหนึ่งด้านล่างในการรันและทดสอบระบบ:

### วิธีที่ 1: รันในเครื่องแบบปกติ (Local Development - Native Setup)

วิธีนี้เหมาะสำหรับงานแก้ไข พัฒนา หรือทดสอบโค้ดแบบเรียลไทม์ (Hot Reload)

1.  **โคลนโปรเจกต์และเข้าไปที่โฟลเดอร์งาน**
    ```bash
    cd my_app_Payment
    ```

2.  **ติดตั้ง dependencies**
    เนื่องจากโปรเจกต์มีการรันบน Angular 18 และโมดูลกราฟที่ทันสมัย ให้ติดตั้งโดยข้ามปัญหาความเข้ากันได้แบบ peer dependencies:
    ```bash
    npm install --legacy-peer-deps
    ```

3.  **สตาร์ทระบบจำลองฐานข้อมูล (Mock API Backend)**
    เปิด Terminal แรกแล้วรันคำสั่งจำลอง API ผ่านพอร์ต `3000`:
    ```bash
    npx json-server --watch mock-api/db.json --port 3000
    ```

4.  **สตาร์ทระบบหน้าบ้าน (Ionic Frontend Dev Server)**
    เปิด Terminal ที่สองแล้วรันเซิร์ฟเวอร์หน้าบ้าน:
    ```bash
    ionic serve
    ```
    หรือ
    ```bash
    npm start
    ```

5.  **เปิดใช้งานระบบ**
    *   เปิดบราวเซอร์ไปที่: `http://localhost:8100` (หรือพอร์ตที่หน้าจอ Ionic แจ้งขึ้นมา)
    *   **ข้อมูลการเข้าระบบ (Login Credentials):**
        *   **Username / Email:** `admin@hospital.com`
        *   **Password:** `password` (หรือกรอกข้อมูลอะไรก็ได้เพื่อเข้าสู่ระบบทดสอบ)

---

### วิธีที่ 2: รันผ่าน Docker Compose (One-Command Quick Start)

วิธีนี้ง่ายและเร็วที่สุด ไม่ต้องติดตั้ง Node.js หรือเครื่องมืออื่นๆ ในเครื่องคอมพิวเตอร์ของคุณเลย ทุกอย่างจะถูกติดตั้งและรันภายใน Docker Containers โดยอัตโนมัติ

1.  **รันระบบด้วย Docker Compose**
    ไปที่โฟลเดอร์หลักของโปรเจกต์แล้วรันคำสั่ง:
    ```bash
    docker-compose up --build -d
    ```

2.  **การเข้าใช้งาน**
    *   **หน้าบ้าน (Frontend Web Client):** `http://localhost:4200`
    *   **ระบบจำลองข้อมูล (Mock API Server):** `http://localhost:3000`

3.  **หยุดการทำงานของระบบ**
    เมื่อต้องการหยุดระบบ ให้ใช้คำสั่ง:
    ```bash
    docker-compose down
    ```

---

## 📂 โครงสร้างของโปรเจกต์ (Project Structure Overview)
```text
my_app_Payment/
├── mock-api/               # แฟ้มเก็บระบบจำลองข้อมูลฐานข้อมูล API
│   ├── db.json             # ข้อมูลดิบสำหรับจำลองสถิติและเคสทางการแพทย์ต่างๆ
│   └── Dockerfile          # สำหรับสร้าง Container ของ Mock API
├── src/                    # โค้ดต้นฉบับของแอปพลิเคชัน
│   ├── app/
│   │   ├── login/          # หน้าล็อคอินสุดหรูหราพร้อมอนิเมชัน
│   │   └── dashboard/      # หน้าแสดงสถิติ วิเคราะห์ กราฟ และระบบส่งออก Excel/CSV
│   └── index.html
├── Dockerfile              # Dockerfile ของฝั่ง Frontend (Build & Serve ด้วย Nginx)
├── docker-compose.yml      # ไฟล์จัดระเบียบ Docker Containers ทั้งระบบ
├── nginx.conf              # ค่าคอนฟิกของ Nginx เพื่อทำ Routing ใน Angular
└── package.json            # ไฟล์ระบุ dependencies และคำสั่งการรัน
```

---

## 📊 ตัวอย่างข้อมูลจำลองในระบบ (Sample Database Schema)
ข้อมูลในหน้าจอ Dashboard จะถูกดึงผ่าน RESTful API จริง โดยจำลองจาก `mock-api/db.json` ซึ่งประกอบด้วย:
*   `/xrays` - รายชื่อเคสเอ็กซ์เรย์ที่คัดกรองทั้งหมด
*   `/consults` - รายชื่อเคสผู้รับคำปรึกษาทางการแพทย์ทั้งหมด
*   `/dashboard` - ข้อมูลสรุปและเปรียบเทียบสถิติรายเดือน

สามารถเข้าชมและทดสอบ API สดๆ ได้ที่ `http://localhost:3000/xrays` ขณะที่เซิร์ฟเวอร์ Backend กำลังทำงาน
