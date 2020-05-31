var http = require("http");

import {IGeolocation} from "../Geolocation/GeolocationService";

export default abstract class WeatherService {
    public static getWeatherDataByLocation(location: IGeolocation) {
        http.getJSON(`https://api.darksky.net/forecast/d9886212e11a316fd79e9a08815df546/${location.latitude},${location.longitude}/?lang=nl&units=ca`).then(
            result => {
                console.log(result)
            },
            error => {
                console.log(error)
            }
        );
    }
}