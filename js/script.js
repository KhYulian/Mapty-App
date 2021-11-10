'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// <<<< ==== ==== ==== ==== ==== ==== ==== ==== >>>>
// How to plan a web project

// Before you write a single line of code you need to plan your project
// 1. User story - description of the application's functionality from the user's perspective. All user stories put together describe the entire application It's a high level overview of the whole application
// 2. Features to implement
// 3. Flowchart - what we will build
// 4. Architecture - how we wil build it
// 5. Development - implementation of our plan using code

// Common format of user stories - As a [type of user(Who?)], I want [an action(What?)] so that [a benefit(Why?)]
// 1. As a user I want to log my running workouts with location, distance, time, pace and steps/minute, so I keep a log of a my running
// 2. As a user, I want to log my cycling workouts with location, distance, time, speed and elevation gain, so i can keep a log of all my cycling
// 3. As a user, I want to see all my workouts at a glance, so I can easily track my progress over time
// 4. As a user, I want to also see my workouts on a map, so I can easily check where i work out the most
// 5. As a user, I want to see all my workouts when i leave the app and come back later, so that i can keep using this app over time

// Features
// Map where user clicks to add new workout (best way to get location coordinates);
// Geolocation to display map at current lovation (more user friendly);
// Form to input distance, time, pace, steps/minute

// Form to input distance, time, speed, elevation gain

// Display all workouts in a list

// Display all workouts on the map

// Store workout data in the browser using local storage API

// let map;
// let mapEvent;

class App {
  #map;
  #mapZoom = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from loval storage
    this._getLocalStorage();

    // Attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toogleElevationField);

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
    }
  }

  _loadMap(position) {
    // const latitude = position.coords.latitude
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(workout => {
      this._renderWorkoutMarker(workout);
    });
  }

  _showForm(mapEv) {
    this.#mapEvent = mapEv;

    form.classList.remove('hidden');

    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value = '';
    inputDuration.value = '';
    inputCadence.value = '';
    inputElevation.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toogleElevationField() {
    if (inputType.value === 'running') {
      inputCadence.closest('.form__row').classList.remove('form__row--hidden');
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
    }
    if (inputType.value === 'cycling') {
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
      inputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden');
    }
  }

  _newWorkout(e) {
    const validInputs = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from the form

    const type = inputType.value;
    const distance = Number(inputDistance.value);
    const duration = Number(inputDuration.value);
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    if (type === 'running') {
      const cadence = Number(inputCadence.value);
      // Chech if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence)
      )
        return alert('Input have to be positive number!');

      workout = new Running([lat, lng], distance, duration, cadence);
      this.#workouts.push(workout);
    }

    // If workout running, create running obj
    if (type === 'cycling') {
      const elevation = Number(inputElevation.value);
      // Chech if data is valid
      if (!validInputs(distance, duration) || !Number.isFinite(elevation))
        return alert('Input have to be positive number!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
      this.#workouts.push(workout);
    }
    // Render workout on a map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on the list
    this._renderWorkout(workout);
    // Hide form and cler input field
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();

    //   Clear input fields
    inputDistance.value = '';
    inputDuration.value = '';
    inputCadence.value = '';
    inputElevation.value = '';

    // const coords = [lat, lng];
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 200,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__remove">&times;</div>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    `;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>`;
    }

    form.insertAdjacentHTML('afterend', html);

    if (!document.querySelector('.workout__removeAll')) {
      const removeAll = `<button class="workout__removeAll">Remove All Workouts!</button>`;
      containerWorkouts.insertAdjacentHTML('beforeend', removeAll);
    }
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (e.target.classList.contains('workout__removeAll')) {
      const userConfirms = confirm('Are you sure?');
      if (!userConfirms) return;
      app.reset();
    }
    if (!workoutEl) return;

    if (e.target.classList.contains('workout__remove')) {
      const currentEl = e.target.closest('.workout');
      currentEl.remove();
      // get current local storage
      const localStObj = JSON.parse(localStorage.getItem('workouts'));
      // remover element from local storage
      localStorage.removeItem('workouts');
      localStObj.splice(
        localStObj.findIndex(el => el.id == currentEl.dataset.id),
        1
      );
      localStorage.setItem('workouts', JSON.stringify(localStObj));
      location.reload();
    }

    const workout = this.#workouts.find(
      el => String(el.id) === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoom, {
      animate: true,
      pan: { duration: 1 },
    });

    // Using public interface
    // workout.click();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts)); // use local storage only for small amounts of data.
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(workout => {
      this._renderWorkout(workout);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

class Workout {
  date = new Date();
  id = Date.now();
  clicks = 0;

  constructor(coords, distance, duration) {
    // this.date = ...
    // this.id = ...
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // in min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const app = new App();

// const run1 = new Running([39, -12], 5, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);

// Local storage

// We lost prototype chain when we convert an object to a string
