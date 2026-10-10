# 🎬 BLINDSPOT — 3-Minute Hackathon Demo Script (ForgeHacks 2026)

**Presenter Note:** Record with camera/microphone on. Set screen resolution to 1080p, open `http://localhost:5173`. Keep `DEMO_MODE=true` or use a valid Gemini API key for real-time inference.

---

### [0:00 – 0:40] Act 1: The Problem & The Simple Pitch
* **Visual:** Landing Page (`/` or `Home`).
* **Presenter Script:**
  > *"Every student has experienced this: you read through your notes, everything makes sense, you feel 90% confident, you walk into an exam, and you suddenly get stuck on a real-world application question. Why? Because students confuse familiarity with understanding.*
  >
  > *Welcome to **BLINDSPOT**, built for ForgeHacks 2026. BLINDSPOT turns classroom notes into real-world practice challenges, measures the **Confidence Gap** between how sure you felt and how complete your answer was, guides your thinking with a Socratic hint ladder, and provides a complete course management system with trilingual localization in English, Tamil, and Hindi."*
* **Action:** Click **"Explore Courses"** to view published courses.

---

### [0:40 – 1:20] Act 2: The Learner Practice & Confidence Gap
* **Visual:** Course Study & Practice Screen (`/courses` -> Click "Operating Systems: Deadlock").
* **Presenter Script:**
  > *"As a learner, I see simple 3-step navigation: Notes, Practice, and Results. Let's head straight into Practice.*
  >
  > *The AI poses a scenario: 'Two food delivery riders arrive at a single narrow one-lane bridge from opposite sides at the same instant...' Notice this is a practical scenario that cannot be solved by reciting definitions.*
  >
  > *Before answering, I set my confidence slider to **90%**.*
  >
  > *I'll type (or speak using our microphone input): 'Both riders are waiting for each other so this is always a permanent deadlock.'*
  >
  > *Let's submit..."*
* **Action:** Click **Submit Answer**.
* **Visual:** The animated **Confidence Gap Card** appears.
* **Presenter Script:**
  > *"Look at the result: 'You felt 90% sure, but your answer was 40% complete. Confidence Gap: +50%.' The app isolates our exact misconception: thinking circular wait always creates deadlock even if one rider can reverse.*
  >
  > *Instead of giving away the answer, our **4-Step Socratic Hint Ladder** offers guiding clues one step at a time. The AI asks more than it tells.*
  >
  > *And with one click, I can download a shareable diagnostic card to benchmark my calibration."*

---

### [1:20 – 1:55] Act 3: Trilingual Localization (English / Tamil / Hindi)
* **Visual:** Language Selector dropdown in Navbar.
* **Presenter Script:**
  > *"Education is most impactful in a learner's own language. With one click on the language switch, let's select **தமிழ் (Tamil)**.*
  >
  > *Notice that everything—the buttons, navigation, course titles, practice scenarios, and Socratic hints—instantly translates into clean, natural Tamil. Let's switch to **हिंदी (Hindi)** as well. We enforce 100% key parity across all three languages with automated tests."*
* **Action:** Switch to Tamil, then to Hindi, then back to English.

---

### [1:55 – 2:35] Act 4: Admin Course Lifecycle & Background AI Generator
* **Visual:** Admin Login (`/admin` via password `ADMIN_PASSWORD`) -> Admin Dashboard.
* **Presenter Script:**
  > *"Now let's see how educators manage learning materials. BLINDSPOT features a dedicated Admin portal authenticated via secure environment tokens.*
  >
  > *In the Admin Dashboard, we see real-time student count and average learner Confidence Gap across the cohort.*
  >
  > *Let's open **Course Management**. When an admin creates a course or uploads notes, our background AI worker automatically generates 5 real-life everyday scenarios, 4-step hint ladders, and full English, Tamil, and Hindi translations.*
  >
  > *We also have complete course lifecycle controls: Draft, Publish, Unpublish, Archive/Cancel, and Permanent Delete requiring typed title confirmation to prevent accidental data loss."*
* **Action:** Show the course editor with AI job progress indicator and bilingual question tabs.

---

### [2:35 – 3:00] Act 5: Progress Telemetry & Closing
* **Visual:** Learner Progress Page (`/progress`).
* **Presenter Script:**
  > *"Finally, the Learner Progress screen tracks your Confidence Gap over time. As you practice and internalize mental models, the line trends downward toward zero—meaning your feeling of knowing perfectly matches your real capability.*
  >
  > *BLINDSPOT bridges the gap between memorization and true understanding. Thank you!"*
