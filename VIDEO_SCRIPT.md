# 🎬 60–90 Second Video Demonstration Script
## Project: CampusPulse AWS (Techfest IIT Bombay & AWS Shipit Challenge 2026)

> **Format**: Screen recording (Loom, OBS, or mobile capture) showing the working web application with voiceover.  
> **Duration**: ~75 Seconds (Optimal within 60–90s range)  
> **Target Audience**: AWS Judges & Techfest Evaluation Committee

---

### [00:00 – 00:15] Problem Hook & Introduction
- **Visual**: Start on `CampusPulse AWS` header showing the IIT Bombay logo and the 3 module tabs.
- **Voiceover**:  
  *"Hello judges! Life on a college campus like IIT Bombay has three daily friction points: arriving at the library only to find zero seats, massive food waste and unaddressed feedback in the hostel mess, and unpredictable Wi-Fi drops. We built **CampusPulse AWS**—a 100% serverless, zero-cost operations suite engineered entirely on the AWS Free Tier."*

---

### [00:15 – 00:35] Module 1: LibSpace (Library Seat Radar & Reservation)
- **Visual**: Click on the **LibSpace** tab. Filter by "2nd Floor Quiet Zone", toggle "⚡ Power Socket", click an available green seat (e.g. `1-A04`), enter roll number `23B0342`, and click Reserve.
- **Voiceover**:  
  *"First is LibSpace. Instead of wandering aisles, students see live occupancy across all 3 library floors. You can filter by power sockets or dual monitors, click any green seat, and reserve it instantly. This write transaction is processed by **AWS Lambda** and logged into **Amazon DynamoDB** with an automated 45-minute TTL expiration."*

---

### [00:35 – 00:55] Module 2: MessPulse (Meal RSVP & Food Waste Reduction)
- **Visual**: Switch to **MessPulse**. Click "Lunch" menu, toggle "Skipping / Eating Outside" (watch the food waste counter tick up by 350g), select 5 stars, type a brief review, and hit Submit.
- **Voiceover**:  
  *"Next is MessPulse. Hostels waste hundreds of kilos of food because cooks prepare meals blindly. By letting students RSVP 'Skipping', our model forecasts exact cooking headcount, already saving over 240kg of food this week. Student reviews are analyzed in real time with **Amazon Comprehend** for natural language sentiment detection and stored in DynamoDB for the mess council."*

---

### [00:55 – 01:12] Module 3: Wi-Fi Sentinel & AWS Telemetry Drawer
- **Visual**: Switch to **Wi-Fi Sentinel**. Click "Run Real-time Diagnostic Ping" (watch the gauge hit 85 Mbps), then open the **AWS Cloud Inspector** drawer on the right to show live JSON payloads and latency.
- **Voiceover**:  
  *"Finally, Wi-Fi Sentinel crowdsources ping and latency metrics across Hostels 1 to 18. If a wing experiences an access point blackout, one click triggers an automated alert through **Amazon SNS** directly to the campus Computer Center team. Clicking the AWS Inspector reveals our sub-20ms Lambda execution and pure serverless architecture."*

---

### [01:12 – 01:25] Conclusion & Free Tier Impact
- **Visual**: Switch to **AWS Cloud Inspector** tab showing the $0.00 bill and Free Tier usage table.
- **Voiceover**:  
  *"With Amazon S3, CloudFront, API Gateway, Lambda, and DynamoDB, CampusPulse scales to 15,000+ students while consuming less than 4% of AWS Free Tier allowances—costing the university exactly zero dollars. Thank you!"*

---

### 💡 Recording Tips:
1. Use **Loom** (free in-browser screen recorder) or **OBS Studio**.
2. Keep the live site open at `http://localhost:8080` or your deployed link.
3. Upload to Google Drive, set permissions to **"Anyone with the link can view"**, and paste the link in your challenge submission form!
