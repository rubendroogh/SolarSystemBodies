var geolocation = require("nativescript-geolocation")
var http = require("http")

export interface IGeolocationSettings {
    desiredAccuracy: number,
    updateDistance: number,
    maximumAge: number,
    timeout: number
}

export interface IGeolocation {
    latitude: number,
    longitude: number,
    altitude?: number,
    horizontalAccuracy: number,
    verticalAccuracy: number,
    speed: number,
    timestamp: Date
}

export default abstract class GeolocationService {
    // todo: always check if location is available

    public static isLocationAvailable(): Promise<boolean> {
        return new Promise(function(resolve, reject) {
            geolocation.isEnabled().then( result => {
                resolve(result)
            })
        })
    }

    // Returns true if permission is given
    public static checkLocationPermission(): Promise<boolean> {
        return new Promise(function(resolve, reject) {
            geolocation.enableLocationRequest().then( _ => {
                GeolocationService.isLocationAvailable().then( result => {
                    resolve(result)
                })
            })
        })
    }

    public static getLocation(locationSettings?: IGeolocationSettings): Promise<IGeolocation> {
        return new Promise(function(resolve, reject) {
            let locationSettingsToUse = {
                desiredAccuracy: locationSettings?.desiredAccuracy ?? 3,
                updateDistance: locationSettings?.updateDistance ?? 10,
                maximumAge: locationSettings?.maximumAge ?? 20000,
                timeout: locationSettings?.timeout ?? 20000
            };

            geolocation.getCurrentLocation(locationSettingsToUse).then( location => {
                let locationObject = {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    altitude: location.altitude,
                    horizontalAccuracy: location.horizontalAccuracy,
                    verticalAccuracy: location.verticalAccuracy,
                    speed: location.speed,
                    timestamp: location.timestamp
                }

                resolve(locationObject)
            }), e => { reject(e) }
        })
    }

    public static getLocationName(location: IGeolocation):  Promise<string> {
        return new Promise(function(resolve, reject) {
            var options = {
                url: `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.latitude}&lon=${location.longitude}`,
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/525.19 (KHTML, like Gecko) Chrome/1.0.154.53 Safari/525.19"
                }
            }

            http.request(options).then(
                result => {
                    var data = JSON.parse(result.content)
                    if (data.name) {
                        resolve(data.name)
                    } else if (data.address.suburb && data.address.city){
                        resolve(`${data.address.suburb}, ${data.address.city}`)
                    } else if (data.address.state && data.address.country) {
                        resolve(`${data.address.state}, ${data.address.country}`)
                    } else {
                        resolve('The middle of nowhere')
                    }
                }, e => { reject(e) }
            )
        })
    }
}