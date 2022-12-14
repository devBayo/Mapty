'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// Challenge
const editButton = document.querySelector('.edit-button');

// Main Class 'Workout'
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    const workoutDate = new Intl.DateTimeFormat(navigator.language, {
      month: 'long',
      day: 'numeric',
    }).format(this.date);

    this.description = `${this.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} 
    ${this.type.replace(
      this.type[0],
      this.type[0].toUpperCase()
    )} on ${workoutDate}`;
  }

  click() {
    ++this.clicks;
  }
}

// Child class of workout
class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// Child class of workout
class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/////////////////////////
// Applying Architechture
class App {
  // Fields
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  #workouts = [];

  constructor() {
    // get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Event Listeners
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener(
      'change',
      this._toggleElevationField.bind(this, inputCadence, inputElevation)
    );

    document
      .querySelector('#map')
      .addEventListener('click', this._preventHtmlError.bind(this));

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));

    // review
    // containerWorkouts.addEventListener(
    //   'click',
    //   this._togglePreviousElevationField.bind(this)
    // );

    containerWorkouts.addEventListener('click', this._editWork.bind(this));
  }

  getWorkouts() {
    return this.#workouts;
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          // Uncomment later
          // alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;

    // displaying map using leaflet
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => this._renderWorkoutMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;

    // Rendering workout input form
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    form.reset();
    form.style.display = 'none';
    form.classList.add('hidden');

    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField(cadence, elevation) {
    cadence.closest('.form__row').classList.toggle('form__row--hidden');
    elevation.closest('.form__row').classList.toggle('form__row--hidden');
    this._preventHtmlError();
  }

  _hideElevationField() {
    inputCadence.closest('.form__row').classList.remove('form__row--hidden');
    inputElevation.closest('.form__row').classList.add('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout is running, create a running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid (validation has been handled in html already)
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout is cycling, create a cycling object
    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;

      // Check if data is valid (validation has been handled in html already)
      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }

    ////////////////////
    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on the list
    this._renderWorkout(workout);
    this._renderWorkoutMarker(workout);

    // Hide form + clear form fields
    this._hideForm();

    // Hide elevationField
    this._hideElevationField();

    // Store workouts in local storage
    this._setLocalStorage();
  }

  _renderWorkout(workout) {
    // prettier-ignore
    const { type, distance, duration, id,cadence,
      elevationGain, pace,speed, description} = workout;

    const html = `
      <li class="workout workout--${type}" data-id="${id}">
        <h2 class="workout__title">${description}</h2>
          <div class="workout__details workout__details--distance">
            <span class="workout__icon">${
              type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details workout__details--time">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details workout__details--cadenceorgain">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${
              type === 'running' ? cadence : elevationGain
            }</span>
            <span class="workout__unit">${
              type === 'running' ? 'min/km' : 'km/h'
            }</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${
              type === 'running' ? '🦶🏼' : '⛰'
            }</span>
            <span class="workout__value">${
              type === 'running' ? pace.toFixed(1) : speed.toFixed(1)
            }</span>
            <span class="workout__unit">${
              type === 'running' ? 'spm' : 'm'
            }</span>
          </div>

          <button class="edit-button">Edit</button>
        </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.description}`)
      .openPopup();
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.#workouts.find(el => el.id === workoutEl.dataset.id);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    workout.click();
  }

  _makeFieldsRequired() {
    document
      .querySelectorAll('.form__input--validate')
      .forEach(input => input.setAttribute('required', ''));
  }

  _preventHtmlError() {
    this._makeFieldsRequired();
    const hiddenForm = document.querySelector('.form__row--hidden');

    // remove required
    const inputField = hiddenForm.querySelector('input');
    inputField.removeAttribute('required');
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => {
      work.__proto__ = Object.create(Workout.prototype);
      this._renderWorkout(work);
    });
  }

  reset() {
    // reset database
    localStorage.removeItem('workouts');
    location.reload();
  }

  _editWork(e) {
    // Select workout
    if (!e.target.classList.contains('edit-button')) return;
    const workoutEl = e.target.closest('.workout');

    // Display edit form
    this._renderEditForm(workoutEl);
  }

  _renderEditForm(el) {
    let { distance, duration, cadenceOrGain } =
      this._previousWorkoutContent(el);

    const html = `
      <form class="form form--edit hidden">
        <div class="form__row">
          <label class="form__label">Type</label>
          <select class="form__input form__input--type form__input--type--edit">
            <option value="running">Running</option>
            <option value="cycling">Cycling</option>
          </select>
        </div>
        <div class="form__row">
          <label class="form__label">Distance</label>
          <input
            class="form__input form__input--distance form__input--distance--edit"
            type="number"
            min="1"
            placeholder="km"
            value=${distance.textContent}
            required
          />
        </div>
        <div class="form__row">
          <label class="form__label">Duration</label>
          <input
            class="form__input form__input--duration form__input--duration--edit"
            type="number"
            placeholder="min"
            value=${duration.textContent}
            min="1"
            required
          />
        </div>
        <div class="form__row">
          <label class="form__label">Cadence</label>
          <input
            class="form__input form__input--cadence form__input--cadence--edit form__input--validate"
            type="number"
            min="1"
            placeholder="step/min"
            value=${cadenceOrGain.textContent}
            required
          />
        </div>
        <div class="form__row form__row--hidden">
          <label class="form__label">Elev Gain</label>
          <input
            class="form__input form__input--elevation form__input--elevation--edit form__input--validate"
            type="number"
            placeholder="meters"
            value=${cadenceOrGain.textContent}
            required
          />
        </div>
        <button class="form__btn">OK</button>
    </form>
    `;
    el.insertAdjacentHTML('beforeend', html);
    const editForm = document.querySelector('.form--edit');
    editForm.classList.remove('hidden');

    editForm.addEventListener('submit', function (e) {
      e.preventDefault();
      distance.textContent = editForm.querySelector(
        '.form__input--distance--edit'
      ).value;
      duration.textContent = editForm.querySelector(
        '.form__input--duration--edit'
      ).value;
      // cadenceOrGain.textContent = editForm.querySelector(
      //   '.form__input--distance--edit'
      // ).value;
      editForm.classList.add('hidden');
    });
  }

  _previousWorkoutContent(el) {
    const distance = el
      .querySelector('.workout__details--distance')
      .querySelector('.workout__value');

    const duration = el
      .querySelector('.workout__details--time')
      .querySelector('.workout__value');

    const cadenceOrGain = el
      .querySelector('.workout__details--cadenceorgain')
      .querySelector('.workout__value');

    return { distance, duration, cadenceOrGain };
  }

  // review
  _previousWorkoutForm() {
    const inputTypeEdit = document.querySelector('.form__input--type--edit');
    const inputCadenceEdit = document.querySelector(
      '.form__input--cadence--edit'
    );
    const inputElevationEdit = document.querySelector(
      '.form__input--elevation--edit'
    );

    return { inputTypeEdit, inputCadenceEdit, inputElevationEdit };
  }

  _togglePreviousElevationField(e) {
    const { inputTypeEdit, inputCadenceEdit, inputElevationEdit } =
      this._previousWorkoutForm();

    if (e.target === inputTypeEdit) {
      console.log(e.target === inputTypeEdit);
      inputTypeEdit.addEventListener(
        'change',
        this._toggleElevationField.bind(
          this,
          inputCadenceEdit,
          inputElevationEdit
        )
      );
    }
  }
}

const app = new App();
