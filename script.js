'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance;
    this.duration = duration;
    // console.log(this.id)
  }
  _setDescription() {
    
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks ++;
    console.log(this.clicks);
    
  }
}
// const work=new Workout();

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 2);
    return this.speed;
  }
}

// const run1=new Running([39,-12],5.2,24,178);
// const cyc1=new Cycling([39,-12],25,45,184);
// console.log(run1,cyc1);

/////////////////////////////////////////////////////////////////////////////
//Refactor application:-
class App {
  #map;
  #mapEvent;
  #mapzoomLevel = 13;
  #workout = [];

  constructor() {
    //get user's position
    this._getPosition();
    //Get localstorage
    this._getLocalStorage();
    
    //Event handler
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField); //no need to bind this keyword coz there is no use of this->
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          //In regular function this returns undefined so we use bind method to this keyword.
          //Error callback
          alert('Could not get Position');
        }
      );
  }

  //successful callback
  _loadMap(position) {
    // console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(position.coords.longitude);
    // console.log(position.coords.latitude);

    console.log(
      `https://www.google.com/maps/@${latitude},${longitude},12z?entry=ttu&g_ep=EgoyMDI0MDgyMS4wIKXMDSoASAFQAw%3D%3D`
    );
    //adding leafmap
    this.#map = L.map('map').setView([latitude, longitude], this.#mapzoomLevel);

    L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker([latitude, longitude])
      .addTo(this.#map)
      .bindPopup(`You're here.🚶‍♂️ `)
      .openPopup();
    //Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    //Showing marker for local storage on refresh
this.#workout.forEach(work=>this._renderWorkoutMarker(work));

  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    //Empty inputs
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000); // to get rid of that slide animation used timeout and add grid property
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    //If workout is running create running object

    if (type === 'running') {
      const cadence = +inputCadence.value;
      //Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Input must be Positive number');
      workout = new Running([lat, lng], distance, duration, cadence);
      // console.log(workout);
      this.#workout.push(workout);
    }
    //If workout is cycling create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      //Check if data is valid

      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(elevation)
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Input must be Positive number');
      workout = new Cycling([lat, lng], distance, duration, elevation);
      // console.log(workout);
      //Add new object to workout array
      this.#workout.push(workout);
    }

    //Render workout on map as marker
    this._renderWorkoutMarker(workout);

    //Render workout on list
    this._renderWorkout(workout);
    //clear inputs + Hide form
    this._hideForm();

    //Set local storage
    this._setLocalStorage();
  }
  //Display Marker

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
      .setPopupContent(
        `${workout.type === 'running' ? 'Running ⛹️‍♂️' : 'Cycling 🚴‍♂️'}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
            <li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
                <h2 class="workout__title">${workout.description}</h2>
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
                    <span class="workout__value">${workout.pace.toFixed(
                      1
                    )}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
           </li>
                   `;
    }

    if (workout.type === 'cycling') {
      html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(
                      1
                    )}</span>
                    <span class="workout__unit">km/h</span>
              </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li> 
                    `;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workOutEl = e.target.closest('.workout');
    // console.log(workOutEl);

    if (!workOutEl) return;
    // console.log(this.#workout);

    const workout = this.#workout.find(
      work => work.id === workOutEl.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapzoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    //using public method
//    workout.click();
   
  }
  _setLocalStorage(){
    localStorage.setItem('workouts',JSON.stringify(this.#workout)); //use to convert javascript object to JSON-string.
  }
  _getLocalStorage(){
const data=JSON.parse(localStorage.getItem('workouts')); // convert JSON string to object
if (!data) return;
this.#workout=data;
this.#workout.forEach(work=>this._renderWorkout(work));


  }

  reset(){
    localStorage.removeItem('workouts');
    location.reload(); //reload the current page
  }
}

const app = new App();
