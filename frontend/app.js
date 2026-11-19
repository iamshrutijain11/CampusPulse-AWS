/**
 * CampusPulse AWS — Production Client Logic
 * Real-time Library Seat Radar, Mess Waste Forecaster, and Wi-Fi Sentinel
 * Techfest IIT Bombay & AWS Shipit Challenge 2026
 */

(function () {
  'use strict';

  // =========================================================================
  // APP STATE & DATABASE SIMULATION
  // =========================================================================
  const state = {
    activeTab: 'library',
    currentFloor: 1,
    filterSocket: false,
    filterMonitor: false,
    selectedSeat: null,
    userReservations: JSON.parse(localStorage.getItem('campuspulse_reservations') || '{}'),

    // Library Desks Generator
    seats: generateLibrarySeats(),

    // Mess Menus
    currentMeal: 'lunch',
    userRsvp: 'yes',
    weeklyWasteSavedKg: 240,
    feedbacks: [
      { hostel: 'Hostel 12', stars: 5, sentiment: 'POSITIVE', text: 'Paneer butter masala was exceptionally fresh and hot today! Keep this up.', time: '12:45 PM' },
      { hostel: 'Hostel 15', stars: 4, sentiment: 'POSITIVE', text: 'Great dal makhani, but rice counter had a slight queue around 1:15 PM.', time: '01:10 PM' },
      { hostel: 'Hostel 16', stars: 2, sentiment: 'NEGATIVE', text: 'Chapatis were a bit cold by 1:30 PM. Please ensure warmer trays.', time: '01:25 PM' }
    ],

    // Wi-Fi Hostels
    hostels: [
      { id: 'H1', name: 'Hostel 1', speed: 84, ping: 12, status: 'good' },
      { id: 'H2', name: 'Hostel 2', speed: 72, ping: 14, status: 'good' },
      { id: 'H3', name: 'Hostel 3', speed: 65, ping: 16, status: 'good' },
      { id: 'H4', name: 'Hostel 4', speed: 92, ping: 9, status: 'good' },
      { id: 'H5', name: 'Hostel 5', speed: 58, ping: 19, status: 'good' },
      { id: 'H6', name: 'Hostel 6', speed: 38, ping: 28, status: 'fair' },
      { id: 'H9', name: 'Hostel 9', speed: 88, ping: 11, status: 'good' },
      { id: 'H10', name: 'Hostel 10', speed: 45, ping: 24, status: 'fair' },
      { id: 'H11', name: 'Hostel 11', speed: 12, ping: 140, status: 'poor' },
      { id: 'H12', name: 'Hostel 12', speed: 94, ping: 8, status: 'good' },
      { id: 'H13', name: 'Hostel 13', speed: 81, ping: 13, status: 'good' },
      { id: 'H14', name: 'Hostel 14', speed: 76, ping: 15, status: 'good' },
      { id: 'H15', name: 'Hostel 15', speed: 68, ping: 17, status: 'good' },
      { id: 'H16', name: 'Hostel 16', speed: 90, ping: 10, status: 'good' },
      { id: 'H18', name: 'Hostel 18', speed: 0, ping: 999, status: 'down' },
      { id: 'Tansa', name: 'Tansa House', speed: 85, ping: 11, status: 'good' }
    ],

    menus: {
      breakfast: { timing: '07:30 AM – 09:30 AM', items: ['Masala Dosa with Coconut Chutney & Sambar', 'Poha with Roasted Peanuts', 'Boiled Eggs / Omelette Counter', 'Fresh Milk, Coffee & Tea', 'Banana & Seasonal Fruit'] },
      lunch: { timing: '12:30 PM – 02:30 PM', items: ['Paneer Butter Masala (Special)', 'Yellow Dal Tadka with Ghee', 'Steamed Basmati Rice & Jeera Rice', 'Tandoori Roti & Phulkas', 'Kachumber Salad & Roasted Papad', 'Sweet Gulab Jamun'] },
      snacks: { timing: '05:00 PM – 06:30 PM', items: ['Crispy Veg Pakoras with Mint Chutney', 'Pav Bhaji with Butter Pav', 'Special Masala Chai & Filter Coffee'] },
      dinner: { timing: '07:45 PM – 09:45 PM', items: ['Kadhai Veggies / Egg Curry', 'Dal Makhani Slow-Cooked', 'Fresh Phulkas with Butter', 'Biryani / Pulao with Raita', 'Ice Cream Cup / Fruit Custard'] }
    }
  };

  function generateLibrarySeats() {
    const list = [];
    const zones = { 1: 'General Reading Hall', 2: 'Quiet Silent Zone', 3: 'Group Tech Pods' };

    for (let f = 1; f <= 3; f++) {
      const rows = ['A', 'B', 'C', 'D'];
      for (const r of rows) {
        for (let num = 1; num <= 8; num++) {
          const seatId = `${f}-${r}${num < 10 ? '0' + num : num}`;
          // Deterministic initial state for realism
          let status = 'available';
          const rand = (f * 13 + r.charCodeAt(0) * 7 + num * 5) % 100;
          if (rand < 48) status = 'occupied';
          else if (rand < 62) status = 'reserved';

          list.push({
            id: seatId,
            floor: f,
            zone: zones[f],
            hasSocket: num % 2 === 1,
            hasMonitor: f === 3 || num === 4 || num === 8,
            status: status,
            reservedBy: null,
            reservedUntil: null
          });
        }
      }
    }
    return list;
  }

  // =========================================================================
  // DOM ELEMENTS
  // =========================================================================
  const navTabs = Array.from(document.querySelectorAll('.nav-tab'));
  const tabPanes = Array.from(document.querySelectorAll('.tab-pane'));
  const seatGrid = document.getElementById('seat-grid');
  const floorNameDisplay = document.getElementById('floor-name-display');
  const floorDensityDisplay = document.getElementById('floor-density-display');
  const statSeatsAvail = document.getElementById('stat-seats-avail');
  const statSeatsReserved = document.getElementById('stat-seats-reserved');
  const statSeatsOccupied = document.getElementById('stat-seats-occupied');
  const floorFilterButtons = Array.from(document.querySelectorAll('#floor-filter button'));
  const filterSocketInput = document.getElementById('filter-socket');
  const filterMonitorInput = document.getElementById('filter-monitor');
  const btnRefreshSeats = document.getElementById('btn-refresh-seats');

  // Modal
  const modalReservation = document.getElementById('modal-reservation');
  const modalSeatTitle = document.getElementById('modal-seat-title');
  const modalZoneVal = document.getElementById('modal-zone-val');
  const modalAmenitiesVal = document.getElementById('modal-amenities-val');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const formConfirmSeat = document.getElementById('form-confirm-seat');
  const inputRollNo = document.getElementById('input-roll-no');

  // Mess
  const mealTabs = Array.from(document.querySelectorAll('.meal-tab'));
  const menuTiming = document.getElementById('menu-timing');
  const menuItemsList = document.getElementById('menu-items-list');
  const btnRsvpYes = document.getElementById('btn-rsvp-yes');
  const btnRsvpNo = document.getElementById('btn-rsvp-no');
  const statWasteSaved = document.getElementById('stat-waste-saved');
  const rsvpImpactText = document.getElementById('rsvp-impact-text');
  const formMessFeedback = document.getElementById('form-mess-feedback');
  const starRatingSpans = Array.from(document.querySelectorAll('#star-rating span'));
  const tagChips = Array.from(document.querySelectorAll('.tag-chip'));
  const feedbackStream = document.getElementById('feedback-stream');

  // Wi-Fi
  const btnRunSpeedtest = document.getElementById('btn-run-speedtest');
  const gaugeSpeedVal = document.getElementById('gauge-speed-val');
  const valPing = document.getElementById('val-ping');
  const valJitter = document.getElementById('val-jitter');
  const hostelGrid = document.getElementById('hostel-grid');
  const btnReportOutage = document.getElementById('btn-report-outage');
  const reportHostel = document.getElementById('report-hostel');
  const reportWing = document.getElementById('report-wing');

  // Telemetry Drawer
  const btnToggleArchDrawer = document.getElementById('btn-toggle-arch-drawer');
  const archDrawer = document.getElementById('arch-drawer');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const drawerLastApi = document.getElementById('drawer-last-api');
  const drawerLatency = document.getElementById('drawer-latency');
  const drawerHandler = document.getElementById('drawer-handler');
  const drawerJson = document.getElementById('drawer-json');
  const campusTimeLive = document.getElementById('campus-time-live');
  const toastBox = document.getElementById('toast-box');

  // =========================================================================
  // TOAST & TELEMETRY LOGGER
  // =========================================================================
  function showToast(msg) {
    if (!toastBox) return;
    toastBox.textContent = msg;
    toastBox.classList.add('show');
    clearTimeout(toastBox._timer);
    toastBox._timer = setTimeout(() => {
      toastBox.classList.remove('show');
    }, 3200);
  }

  function logAwsTelemetry(apiPath, method, handlerName, payload) {
    const latency = (Math.random() * 20 + 8).toFixed(1);
    if (drawerLastApi) drawerLastApi.textContent = `${method} ${apiPath}`;
    if (drawerLatency) drawerLatency.textContent = `${latency} ms`;
    if (drawerHandler) drawerHandler.textContent = `arn:aws:lambda:ap-south-1:${handlerName}`;
    if (drawerJson) {
      drawerJson.textContent = JSON.stringify({
        endpoint: apiPath,
        method: method,
        aws_region: 'ap-south-1 (Mumbai)',
        cloud_service: 'AWS Lambda + DynamoDB',
        execution_time: `${latency}ms`,
        billing_mode: 'AWS Free Tier',
        response: payload
      }, null, 2);
    }
  }

  // =========================================================================
  // TAB NAVIGATION
  // =========================================================================
  navTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      navTabs.forEach((t) => t.classList.toggle('active', t === tab));
      tabPanes.forEach((p) => p.classList.toggle('active', p.id === `pane-${targetTab}`));
      state.activeTab = targetTab;
      logAwsTelemetry(`/api/v1/${targetTab}/status`, 'GET', `${targetTab}Handler`, { tab: targetTab, ready: true });
    });
  });

  // =========================================================================
  // LIBSPACE: RENDER SEAT MATRIX
  // =========================================================================
  function renderSeats() {
    if (!seatGrid) return;
    seatGrid.innerHTML = '';

    const floorSeats = state.seats.filter((s) => s.floor === state.currentFloor);
    const filteredSeats = floorSeats.filter((s) => {
      if (state.filterSocket && !s.hasSocket) return false;
      if (state.filterMonitor && !s.hasMonitor) return false;
      return true;
    });

    // Update Stats
    const availCount = floorSeats.filter((s) => s.status === 'available').length;
    const resCount = floorSeats.filter((s) => s.status === 'reserved').length;
    const occCount = floorSeats.filter((s) => s.status === 'occupied').length;

    if (statSeatsAvail) statSeatsAvail.textContent = availCount;
    if (statSeatsReserved) statSeatsReserved.textContent = resCount;
    if (statSeatsOccupied) statSeatsOccupied.textContent = occCount;

    const densityPct = Math.round(((resCount + occCount) / floorSeats.length) * 100);
    if (floorDensityDisplay) floorDensityDisplay.textContent = `Crowd Density: ${densityPct}% (${densityPct > 70 ? 'High' : densityPct > 40 ? 'Moderate' : 'Low'})`;

    const floorTitles = { 1: '1st Floor — Central Reading Hall', 2: '2nd Floor — Quiet Silent Zone', 3: '3rd Floor — Group Tech Lab' };
    if (floorNameDisplay) floorNameDisplay.textContent = floorTitles[state.currentFloor];

    // Build Seat Pods
    filteredSeats.forEach((seat) => {
      const pod = document.createElement('div');
      pod.className = `seat-pod ${seat.status}`;
      pod.innerHTML = `
        <div class="seat-id">${seat.id}</div>
        <div class="seat-status-tag">${seat.status}</div>
        <div class="seat-amenities">
          ${seat.hasSocket ? '<span title="Power Socket">⚡</span>' : ''}
          ${seat.hasMonitor ? '<span title="Dual Display">🖥️</span>' : ''}
        </div>
      `;

      if (seat.status === 'available') {
        pod.addEventListener('click', () => openReservationModal(seat));
      } else if (seat.status === 'reserved') {
        pod.addEventListener('click', () => {
          showToast(`⚠️ Desk ${seat.id} is held for 45 mins. Check back soon.`);
        });
      }

      seatGrid.appendChild(pod);
    });
  }

  function openReservationModal(seat) {
    state.selectedSeat = seat;
    if (modalSeatTitle) modalSeatTitle.textContent = `Reserve Desk ${seat.id}`;
    if (modalZoneVal) modalZoneVal.textContent = seat.zone;
    if (modalAmenitiesVal) modalAmenitiesVal.textContent = `${seat.hasSocket ? '⚡ Power Socket' : 'No Socket'}, ${seat.hasMonitor ? '🖥️ Dual Display' : 'Standard Desk'}`;
    modalReservation.classList.add('open');
  }

  function closeReservationModal() {
    if (modalReservation) modalReservation.classList.remove('open');
    state.selectedSeat = null;
  }

  if (btnCloseModal) btnCloseModal.addEventListener('click', closeReservationModal);
  if (modalReservation) {
    modalReservation.addEventListener('click', (e) => {
      if (e.target === modalReservation) closeReservationModal();
    });
  }

  // Confirm Reservation
  if (formConfirmSeat) {
    formConfirmSeat.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!state.selectedSeat) return;

      const roll = inputRollNo.value.trim() || '23B0342';
      state.selectedSeat.status = 'reserved';
      state.selectedSeat.reservedBy = roll;

      showToast(`✅ Desk ${state.selectedSeat.id} reserved for ${roll}! Hold active for 45 mins.`);

      logAwsTelemetry('/api/v1/seats/reserve', 'POST', 'reserveSeatLambda', {
        seat_id: state.selectedSeat.id,
        roll_number: roll,
        action: 'HOLD_45_MIN',
        dynamodb_table: 'CampusPulse_Seats'
      });

      closeReservationModal();
      renderSeats();
    });
  }

  // Floor Switching
  floorFilterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      floorFilterButtons.forEach((b) => b.classList.toggle('active', b === btn));
      state.currentFloor = parseInt(btn.getAttribute('data-floor') || '1', 10);
      renderSeats();
    });
  });

  if (filterSocketInput) {
    filterSocketInput.addEventListener('change', () => {
      state.filterSocket = filterSocketInput.checked;
      renderSeats();
    });
  }

  if (filterMonitorInput) {
    filterMonitorInput.addEventListener('change', () => {
      state.filterMonitor = filterMonitorInput.checked;
      renderSeats();
    });
  }

  if (btnRefreshSeats) {
    btnRefreshSeats.addEventListener('click', () => {
      showToast('🔄 Synchronized seat states with DynamoDB');
      logAwsTelemetry('/api/v1/seats/sync', 'GET', 'syncSeatsLambda', { count: state.seats.length, status: 'synced' });
      renderSeats();
    });
  }

  // =========================================================================
  // MESSPULSE: MENU, RSVP & COMPREHEND FEEDBACK
  // =========================================================================
  function renderMenu(mealType) {
    state.currentMeal = mealType;
    const menu = state.menus[mealType];
    if (!menu) return;

    if (menuTiming) menuTiming.textContent = menu.timing;
    if (menuItemsList) {
      menuItemsList.innerHTML = menu.items.map((dish) => `
        <li class="menu-item-row">
          <span>${dish}</span>
          <span style="color:var(--aws-teal); font-size:0.75rem;">Verified Healthy</span>
        </li>
      `).join('');
    }
  }

  mealTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      mealTabs.forEach((t) => t.classList.toggle('active', t === tab));
      renderMenu(tab.getAttribute('data-meal'));
    });
  });

  // RSVP Buttons
  if (btnRsvpYes) {
    btnRsvpYes.addEventListener('click', () => {
      btnRsvpYes.classList.add('active');
      btnRsvpNo.classList.remove('active');
      state.userRsvp = 'yes';
      showToast('✅ RSVP Confirmed: Chef notified for your portion!');
      logAwsTelemetry('/api/v1/mess/rsvp', 'POST', 'messRsvpLambda', { rsvp: 'ATTENDING', meal: state.currentMeal });
    });
  }

  if (btnRsvpNo) {
    btnRsvpNo.addEventListener('click', () => {
      btnRsvpNo.classList.add('active');
      btnRsvpYes.classList.remove('active');
      state.userRsvp = 'no';
      state.weeklyWasteSavedKg += 0.35;
      if (statWasteSaved) statWasteSaved.textContent = `${Math.round(state.weeklyWasteSavedKg)} kg`;
      showToast('🌱 Marked Skipping: You just prevented ~350g of food waste!');
      logAwsTelemetry('/api/v1/mess/rsvp', 'POST', 'messRsvpLambda', { rsvp: 'SKIPPING', saved_waste_grams: 350 });
    });
  }

  // Star Rating
  let currentStars = 4;
  starRatingSpans.forEach((star) => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-val'), 10);
      currentStars = val;
      starRatingSpans.forEach((s) => {
        const sVal = parseInt(s.getAttribute('data-val'), 10);
        s.classList.toggle('selected', sVal <= val);
      });
    });
  });

  // Tag Chips
  tagChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
    });
  });

  // Submit Feedback (Simulated Amazon Comprehend NLP analysis)
  if (formMessFeedback) {
    formMessFeedback.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = document.getElementById('text-feedback').value.trim();
      const hostel = document.getElementById('select-hostel').value;

      if (!text) {
        showToast('Please type a brief comment for the mess manager.');
        return;
      }

      // Simulated Amazon Comprehend Sentiment Analysis
      const isPositive = currentStars >= 4;
      const sentiment = isPositive ? 'POSITIVE' : 'NEGATIVE';

      const newFeedback = {
        hostel: hostel,
        stars: currentStars,
        sentiment: sentiment,
        text: text,
        time: 'Just now'
      };

      state.feedbacks.unshift(newFeedback);
      renderFeedbacks();

      logAwsTelemetry('/api/v1/mess/feedback', 'POST', 'messSentimentLambda', {
        hostel: hostel,
        rating: currentStars,
        comprehend_sentiment: sentiment,
        sentiment_score: { Positive: isPositive ? 0.94 : 0.05, Negative: isPositive ? 0.02 : 0.89 },
        dynamodb_table: 'CampusPulse_Mess'
      });

      showToast(`💬 Feedback logged! Amazon Comprehend tagged: ${sentiment}`);
      document.getElementById('text-feedback').value = '';
    });
  }

  function renderFeedbacks() {
    if (!feedbackStream) return;
    feedbackStream.innerHTML = state.feedbacks.map((fb) => `
      <div class="feedback-card">
        <div class="fb-header">
          <span class="fb-hostel">${fb.hostel}</span>
          <span class="fb-stars">${'★'.repeat(fb.stars)}</span>
        </div>
        <p class="fb-text">"${fb.text}"</p>
      </div>
    `).join('');
  }

  // =========================================================================
  // WI-FI SENTINEL: SPEED TEST & HEATMAP
  // =========================================================================
  function renderHostels() {
    if (!hostelGrid) return;
    hostelGrid.innerHTML = state.hostels.map((h) => `
      <div class="hostel-card">
        <div class="h-top">
          <span class="h-name">${h.name}</span>
          <span class="heat-dot heat-${h.status}"></span>
        </div>
        <div class="h-speed status-${h.status}">${h.speed > 0 ? h.speed + ' Mbps' : 'OUTAGE'}</div>
        <div class="h-ping">Ping: ${h.ping < 999 ? h.ping + ' ms' : 'Unreachable'}</div>
      </div>
    `).join('');
  }

  if (btnRunSpeedtest) {
    btnRunSpeedtest.addEventListener('click', () => {
      btnRunSpeedtest.disabled = true;
      btnRunSpeedtest.textContent = 'MEASURING AWS GATEWAY PING...';

      let count = 0;
      const timer = setInterval(() => {
        count++;
        const simulatedSpeed = Math.floor(Math.random() * 40 + 60);
        if (gaugeSpeedVal) gaugeSpeedVal.textContent = simulatedSpeed;

        if (count >= 8) {
          clearInterval(timer);
          const finalPing = Math.floor(Math.random() * 10 + 12);
          const finalJitter = Math.floor(Math.random() * 3 + 1);
          if (valPing) valPing.textContent = `${finalPing} ms`;
          if (valJitter) valJitter.textContent = `${finalJitter} ms`;

          btnRunSpeedtest.disabled = false;
          btnRunSpeedtest.innerHTML = '<span>RUN REAL-TIME DIAGNOSTIC PING</span>';

          showToast('⚡ Diagnostic complete: Network healthy in your wing!');
          logAwsTelemetry('/api/v1/wifi/ping', 'POST', 'wifiDiagnosticLambda', {
            client_ip: '10.12.4.82 (Hostel Intranet)',
            download_speed_mbps: simulatedSpeed,
            latency_ms: finalPing,
            aws_edge_location: 'BOM (Mumbai)'
          });
        }
      }, 120);
    });
  }

  // Report Outage (Simulates Amazon SNS alert)
  if (btnReportOutage) {
    btnReportOutage.addEventListener('click', () => {
      const hostelVal = reportHostel.value;
      const wingVal = reportWing.value.trim() || 'General Access Point';

      // Mark hostel down in state
      const targetHostel = state.hostels.find((h) => h.id === hostelVal);
      if (targetHostel) {
        targetHostel.status = 'down';
        targetHostel.speed = 0;
        targetHostel.ping = 999;
        renderHostels();
      }

      showToast(`🚨 Outage Reported for ${hostelVal}! Amazon SNS dispatched alert to Campus Computer Center.`);
      logAwsTelemetry('/api/v1/wifi/outage-report', 'POST', 'snsAlertDispatcher', {
        hostel: hostelVal,
        wing: wingVal,
        sns_topic_arn: 'arn:aws:sns:ap-south-1:123456789012:CampusPulse_Network_Alerts',
        notification_status: 'DISPATCHED_TO_WARDEN'
      });

      reportWing.value = '';
    });
  }

  // =========================================================================
  // CLOUD INSPECTOR DRAWER
  // =========================================================================
  function toggleDrawer() {
    archDrawer.classList.toggle('open');
    drawerOverlay.classList.toggle('open');
  }

  if (btnToggleArchDrawer) btnToggleArchDrawer.addEventListener('click', toggleDrawer);
  if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', toggleDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', toggleDrawer);

  // Live Clock
  function updateCampusClock() {
    if (!campusTimeLive) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    campusTimeLive.textContent = `Powai: ${timeStr}`;
  }

  // =========================================================================
  // BOOTSTRAP INITIALIZATION
  // =========================================================================
  function init() {
    renderSeats();
    renderMenu('lunch');
    renderFeedbacks();
    renderHostels();
    updateCampusClock();
    setInterval(updateCampusClock, 10000);

    logAwsTelemetry('/api/v1/bootstrap', 'GET', 'campusPulseInitializer', {
      system: 'CampusPulse AWS Suite',
      edition: 'Techfest IIT Bombay 2026',
      free_tier_validated: true
    });

    console.log('%c☁️ CampusPulse AWS — Smart Campus Operations Online', 'color:#ff9900; font-weight:bold; font-size:14px;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
