# API CONTRACT — MENTE DE ACERO V2

**Document Version:** 2.0.0  
**Compliance Requirement:** Frontend and backend must strictly honor this contract.

---

## 1. Authentication & Session Endpoints

### 1.1 `POST /api/auth/login`
- **Auth:** Public
- **Role:** N/A (Rate limited: 5 failed attempts per client key = 15m block)
- **Request Body:**
  ```json
  {
    "username": "1001234567",
    "password": "TemporaryPassword123"
  }
  ```
- **Response `200 OK`:**
  - Header: `Set-Cookie: app_session=...; HttpOnly; SameSite=Lax; Path=/`
  ```json
  {
    "user": {
      "username": "1001234567",
      "role": "participant",
      "mustChangePassword": true,
      "person": {
        "id": "person-123",
        "idNumber": "1001234567",
        "fullName": "Andrés Gómez",
        "age": "24",
        "gender": "M",
        "rankCode": "SLP",
        "rankName": "Soldado Profesional",
        "unit": "BATALLÓN 12"
      }
    }
  }
  ```
- **Errors:** `400 Bad Request`, `401 Unauthorized` (`"Usuario o contraseña incorrectos."`), `429 Too Many Requests`.
- **Consumers:** `login.js`, `LoginForm` component.

---

### 1.2 `GET /api/auth/me`
- **Auth:** Cookie Session (`app_session`)
- **Role:** `participant` | `admin`
- **Request:** None
- **Response `200 OK`:**
  ```json
  {
    "user": {
      "username": "1001234567",
      "role": "participant",
      "mustChangePassword": false,
      "person": { "idNumber": "1001234567", "fullName": "Andrés Gómez" }
    },
    "assignments": [
      {
        "id": "asg-1",
        "instrumentCode": "baron",
        "required": true,
        "status": "in_progress",
        "percentageComplete": 65,
        "completedAt": null
      }
    ]
  }
  ```
- **Errors:** `401 Unauthorized`.
- **Consumers:** `portal.js`, `app.js`, `AppShell`.

---

### 1.3 `POST /api/auth/change-password`
- **Auth:** Cookie Session (`app_session`)
- **Role:** `participant` (including `must_change_password=true`)
- **Request Body:**
  ```json
  {
    "currentPassword": "OldPassword123",
    "newPassword": "NewSecurePassword456!",
    "confirmPassword": "NewSecurePassword456!"
  }
  ```
- **Response `200 OK`:**
  ```json
  { "ok": true }
  ```
- **Errors:** `400 Bad Request` (Password policy violation, mismatch).
- **Consumers:** `login.js`, `PasswordChangeModal`.

---

### 1.4 `POST /api/auth/logout`
- **Auth:** Any
- **Request:** None
- **Response `200 OK`:** Clears `app_session` cookie.
- **Consumers:** Topbar / Sidebar logout buttons.

---

## 2. Psychological Assessment Endpoints

### 2.1 `GET /api/instruments`
- **Auth:** Public / Session
- **Response `200 OK`:**
  ```json
  {
    "instruments": [
      {
        "code": "ema",
        "name": "Escala Multidimensional de Asertividad",
        "version": "EMA 45 reactivos",
        "moduleCount": 1,
        "itemCount": 45
      },
      {
        "code": "baron",
        "name": "Inventario de Cociente Emocional Bar-On ICE",
        "version": "BarOn ICE 133 reactivos",
        "moduleCount": 5,
        "itemCount": 133
      },
      {
        "code": "disc",
        "name": "DISC",
        "version": "DISC v1 manual suministrado",
        "moduleCount": 1,
        "itemCount": 28
      }
    ]
  }
  ```

---

### 2.2 `GET /api/instruments/:code`
- **Auth:** Public / Session
- **Response `200 OK`:** Full instrument definition (modules, items, response options/scales).

---

### 2.3 `POST /api/applications/start`
- **Auth:** Participant Session
- **Request Body:**
  ```json
  {
    "instrumentCode": "baron"
  }
  ```
- **Response `200 OK`:** Application object with ID, participant snapshot, and module definitions.

---

### 2.4 `POST /api/applications/:id/answers`
- **Auth:** Participant Session (owns application)
- **Request Body:**
  ```json
  {
    "answers": [
      { "itemId": 1, "value": 4 },
      { "itemId": 2, "value": 5 }
    ]
  }
  ```
- **Response `200 OK`:** Updated application aggregate with real-time recalculated percentage, partial results, and final result if complete.
- **Errors:** `400 Bad Request` (Invalid answer value / DISC MAS=MENOS collision), `403 Forbidden`, `404 Not Found`.
- **Consumers:** `app.js` test runner autosave.

---

## 3. Wellness & Interactive Tools Endpoints (Non-Destructive Extensions)

### 3.1 `GET /api/wellness/summary`
- **Auth:** Participant Session
- **Response `200 OK`:**
  ```json
  {
    "wellnessIndex": 76,
    "deltaWeek": 8,
    "category": "Adecuado",
    "habitCompletionRatio": "3 de 5 completados",
    "weeklyTrend": [
      { "day": "L", "score": 68 },
      { "day": "M", "score": 72 },
      { "day": "M", "score": 70 },
      { "day": "J", "score": 74 },
      { "day": "V", "score": 76 }
    ]
  }
  ```

---

### 3.2 `GET /api/habits/today` & `POST /api/habits/toggle`
- **Auth:** Participant Session
- **Toggle Request Body:**
  ```json
  {
    "habitKey": "sleep",
    "completed": true,
    "numericValue": 7.5
  }
  ```
- **Response `200 OK`:** Today's updated habits list.

---

### 3.3 `GET /api/mood/history` & `POST /api/mood/log`
- **Auth:** Participant Session
- **Log Request Body:**
  ```json
  {
    "valenceLevel": 3,
    "energyLevel": 4,
    "notes": "Me sentí enfocado y en control durante la jornada."
  }
  ```
- **Response `200 OK`:** Returns updated 14-day mood array for the spline chart.

---

### 3.4 `POST /api/tools/session`
- **Auth:** Participant Session
- **Request Body:**
  ```json
  {
    "toolType": "breathing_478",
    "durationSeconds": 300,
    "preStressRating": 7,
    "postStressRating": 3
  }
  ```
- **Response `200 OK`:** Logs completed exercise.

---

### 3.5 `GET /api/support-resources`
- **Auth:** Public / Session
- **Response `200 OK`:**
  ```json
  {
    "resources": [
      {
        "id": "res-1",
        "organizationName": "Línea de Orientación Psicológica",
        "phoneNumber": "01 800 123 4567",
        "availableHours": "24/7",
        "countryCode": "CO",
        "url": null,
        "active": true
      }
    ]
  }
  ```
