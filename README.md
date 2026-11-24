# Weather Now

Weather Now is a responsive weather application that displays the current conditions, daily forecast, and hourly forecast for the user's location or for any city entered in the search field.

## Features

- Automatic geolocation with a Berlin fallback
- City search powered by Open-Meteo geocoding
- 7-day daily forecast
- 8-hour forecast selection for each day
- Weather advice for rain, storms, hot, cool, and cold conditions
- Temperature units: Celsius or Fahrenheit
- Wind units: km/h or mph
- Precipitation units: mm or inches
- Loading, success, and error status messages
- Responsive desktop and mobile layouts
- Accessible controls and weather descriptions

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- Open-Meteo Weather API
- Open-Meteo Geocoding API
- OpenStreetMap Nominatim reverse geocoding

No API key or package installation is required.

## Getting started

Because browser geolocation and API requests work best over a local web server, serve the project folder instead of opening `index.html` directly.

With Python installed:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

Alternative:

```bash
npx serve .
```

## Project structure

```text
weather-app-rivenaltsumbu/
|-- index.html
|-- style.css
|-- schript.js
|-- assets/
|   `-- images/
`-- README.md
```

## Usage

1. Allow or deny location access when prompted.
2. Select **Ma position** to load the weather for your current location again.
3. If location access is unavailable, the app displays Berlin as a fallback.
4. Enter a city or place name and select **Rechercher** to change location.
5. Open **Unités** to switch temperature, wind, and precipitation units.
6. Use the day selector in the hourly forecast panel to view another day.

## External data

- Weather data: [Open-Meteo](https://open-meteo.com/)
- Location search: [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api)
- Neighborhood names: [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/)

Weather data and location information remain subject to the providers' availability and usage policies.
