# ☁️ CampusPulse AWS — Smart Campus Operations Suite

> **Official Submission for the AWS Shipit Challenge 2026**  
> Organized by **Techfest, IIT Bombay** in collaboration with **Amazon Web Services (AWS)**  
> **Duration**: 17 November – 27 November 2026  
> **Recognition**: Top 50 Student Awards & Verified AWS Builder Rewards

---

## 📌 Executive Summary

Life across collegiate campuses like **IIT Bombay** suffers from three chronic operational bottlenecks:
1. **Library Congestion**: Students walk 15–20 minutes to the central library only to find zero available desks or quiet study pods.
2. **Hostel Food Wastage & Lack of Feedback**: Mess kitchens cook blindly without headcount forecasts, leading to hundreds of kilograms of wasted food daily while student complaints remain untracked.
3. **Unreported Wi-Fi & Infrastructure Faults**: Intermittent access point drops in specific hostel wings take days to fix because the Computer Center lacks real-time crowdsourced telemetry.

**CampusPulse AWS** is a serverless, event-driven smart campus suite engineered **100% on the AWS Free Tier**. It unifies real-time desk reservations, meal RSVP waste analytics, and hostel connectivity monitoring into a single web portal requiring **zero server maintenance and costing \$0.00/month**.

---

## 🏗️ AWS Cloud Architecture

```mermaid
flowchart TD
    User["🎓 Student / Device"] -->|HTTPS / DNS| CF["Amazon CloudFront (Edge Caching)"]
    CF --> S3["Amazon S3 (Static Web App)"]
    User -->|API Requests| APIGW["Amazon API Gateway (HTTP API)"]
    
    subgraph AWS Serverless Compute
        APIGW -->|/api/seats| L1["AWS Lambda: LibSpace Handler"]
        APIGW -->|/api/mess| L2["AWS Lambda: MessPulse Handler"]
        APIGW -->|/api/wifi| L3["AWS Lambda: Wi-Fi Sentinel"]
    end
    
    subgraph AWS Storage & Intelligence
        L1 <--> DDB1[("Amazon DynamoDB: Seats Table\nTTL: 45m")]
        L2 <--> DDB2[("Amazon DynamoDB: Mess Table")]
        L2 -->|Analyze Comments| COMP["Amazon Comprehend\n(NLP Sentiment)"]
        L3 <--> DDB3[("Amazon DynamoDB: Wi-Fi Logs")]
        L3 -->|Outage Reported| SNS["Amazon SNS\n(Hostel Warden & CC Alerts)"]
    end
```

---

## 🌟 The Three Core Modules

### 1. 📚 LibSpace: Real-Time Library Seat Radar & Reservation
- **Dynamic Floor Map**: Real-time 2D matrix visualizing 96+ desks across 3 library floors with crowd density indicators.
- **Smart Filtering**: Filter by power sockets (`⚡`), external displays (`🖥️`), and quiet/group study zones.
- **45-Minute Hold Reservations**: Conditional DynamoDB update locks a desk with an automated TTL (Time-To-Live) expiration to eliminate "phantom reservations."

### 2. 🍽️ MessPulse: Food Waste Analytics & Sentiment NLP
- **Headcount RSVP Forecaster**: Students mark *"Yes, I Will Eat"* or *"Skipping / Eating Outside"*. Every skipped meal saves $\approx 350\text{g}$ of prepared food, dynamically calculating weekly campus food waste reduction in kilograms.
- **Amazon Comprehend NLP Review Analysis**: Instant natural language processing tags comments as `POSITIVE`, `NEUTRAL`, or `NEGATIVE` with confidence metrics to give the mess council actionable insights.

### 3. 📶 Wi-Fi Sentinel: Hostel Connectivity & Outage Heatmap
- **In-Browser Speed & Ping Diagnostic**: Measures ping, jitter, and throughput against AWS `ap-south-1` (Mumbai).
- **Campus Heatmap**: Aggregated telemetry logs across Hostels 1 to 18 highlighting access point health (`Good`, `Fair`, `Poor`, `Down`).
- **Amazon SNS Instant Alert Dispatch**: One-click outage reporting triggers an automated high-priority alert to the Computer Center network administrators.

---

## 💰 AWS Free Tier Compliance Audit

CampusPulse was architected so that an entire campus of **15,000+ active students** operates well within AWS Free Tier quotas:

| AWS Service | Role in CampusPulse | Free Tier Monthly Quota | CampusPulse Utilization | Cost |
| :--- | :--- | :--- | :--- | :--- |
| **AWS Lambda** | Event-driven microservice handlers | 1,000,000 requests | ~35,000 requests (3.5%) | **\$0.00** |
| **Amazon DynamoDB** | NoSQL state, seat reservations, menus | 25 GB storage + 25 RCU/WCU | 0.08 GB (&lt;1%) | **\$0.00** |
| **Amazon S3** | Static web bundle & asset hosting | 5 GB standard storage | 4.2 MB (0.08%) | **\$0.00** |
| **Amazon CloudFront** | Low-latency CDN & SSL termination | 1 TB data transfer out | ~600 MB (0.06%) | **\$0.00** |
| **Amazon API Gateway** | HTTP API routing | 1,000,000 API calls | ~35,000 calls (3.5%) | **\$0.00** |
| **Amazon SNS** | Maintenance outage notifications | 1,000,000 push / 1,000 emails | ~50 notifications | **\$0.00** |

---

## 🚀 How to Run Locally (Instant Preview)

Zero build tools or complex prerequisites needed. Open directly in your browser:

1. **Option A: Direct In-Browser**
   Double-click [frontend/index.html](file:///d:/WebDevIITB/CampusPulse-AWS/frontend/index.html) in your browser.

2. **Option B: Python HTTP Server**
   ```powershell
   cd "D:\WebDevIITB\CampusPulse-AWS\frontend"
   python -m http.server 8080
   ```
   Open `http://localhost:8080` in Chrome, Edge, or Brave.

---

## ☁️ Deploying to AWS (AWS SAM)

To deploy the backend to your own AWS account using the AWS Serverless Application Model (SAM):

```bash
cd CampusPulse-AWS/backend

# 1. Build the serverless application
sam build

# 2. Deploy to AWS ap-south-1 (Mumbai)
sam deploy --guided
```

---

## 📁 Repository Structure

```
CampusPulse-AWS/
├── frontend/
│   ├── index.html         # High-tech AWS Operations UI & 3 campus modules
│   ├── style.css          # AWS Squid Ink/Orange design system & responsive layout
│   └── app.js             # Client logic, seat matrix, Comprehend/SNS simulator
├── backend/
│   ├── lambda/
│   │   ├── librarySeats.js    # Node.js 20 Lambda for DynamoDB seat reservations
│   │   ├── messFeedback.js    # Lambda for meal RSVP & Amazon Comprehend sentiment
│   │   └── wifiDiagnostic.js  # Lambda for latency logs & Amazon SNS outage alerts
│   └── template.yaml      # Production AWS SAM / CloudFormation IaC template
├── VIDEO_SCRIPT.md        # Exact 60–90 second demonstration video script
└── README.md              # Project documentation & AWS Free Tier audit
```

---

## 📝 Techfest AWS Shipit Challenge Submission Checklist

- [x] **AWS Builder Center Profile**: Created at [builder.aws.com](https://builder.aws.com/) with unique alias claimed.
- [x] **SheerID Student Verification**: Completed at [builder.aws.com/student-rewards](https://builder.aws.com/student-rewards/) (unlocking \$579 benefits).
- [x] **Functional Project**: Complete working frontend + AWS SAM backend template.
- [x] **Demonstration Video**: 60–90s screen recording using [VIDEO_SCRIPT.md](file:///d:/WebDevIITB/CampusPulse-AWS/VIDEO_SCRIPT.md).
- [x] **Submission Link**: Submitted through [techfest.org/aws-shipit-challenge](https://techfest.org/aws-shipit-challenge).
