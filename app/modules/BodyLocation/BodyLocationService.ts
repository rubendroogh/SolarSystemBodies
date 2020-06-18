import UtilityService from "../Utility/UtilityService"
import { IGeolocation } from "../Geolocation/GeolocationService"
import { AllOrbitalElementPrimitives } from "./BodyLocationConstants"
import {
    IBodyInfo,
    ISpatialCoordinates,
    IEquatorialCoordinates,
    IAzimuthalCoordinates,
    IRiseSetTimes,
    IMagnitude,
    IDayNumberCollection,
    IOrbitalElementsPrimitive,
    IOrbitalElements
} from "./BodyLocationInterfaces"

export enum Body {
    Sun,
    Mercury,
    Venus,
    Moon,
    Mars,
    Jupiter,
    Saturn,
    Uranus,
    Neptune
}

export enum DistanceUnit {
    AU,
    EarthRadii
}

export default abstract class BodyLocationService {
    // 1 Januari 2000 12:00 is day number 0.0
    // To test: 19 april 1990, at 0:00 UT = -3543
    public static getDayNumber(date: Date): IDayNumberCollection {
        var year = date.getUTCFullYear()
        var month = date.getUTCMonth() + 1
        var day = date.getUTCDate()

        var hours = date.getUTCHours()
        var minutes = date.getUTCMinutes()
        var seconds = date.getUTCSeconds()

        var decimalTime = hours + (minutes / 60) + (seconds / 3600)

        var d = 367 * year - Math.round( 7 * (year + (month + 9) / 12) / 4 ) - Math.round( 3 * ((year + (month - 9) / 7) / 100 + 1) / 4 ) + Math.round( 275 * month / 9 ) + day - 730515
        d =  d + (decimalTime / 24.0)

        return { dayNumber: d, decimalTime: decimalTime }
    }

    public static getCurrentDayNumber(): IDayNumberCollection {
        return this.getDayNumber(new Date())
    }

    // Calculate body location in azimuthal coordinates
    public static calculateBodyInfo(body: Body, d: IDayNumberCollection, localPosition: IGeolocation): IBodyInfo {
        // Get data from the requested body and the sun
        var orbitalElementPrimitives: IOrbitalElementsPrimitive = this.getOrbitalElementPrimitives(body)
        var OE: IOrbitalElements = this.initialOrbitalElementsCalculations(orbitalElementPrimitives, d.dayNumber, body)
        var sunOrbitalElementPrimitives: IOrbitalElementsPrimitive = this.getOrbitalElementPrimitives(Body.Sun)
        var sOE: IOrbitalElements = this.initialOrbitalElementsCalculations(sunOrbitalElementPrimitives, d.dayNumber, Body.Sun)

        var ecl = 23.4393 - 3.563E-7 * d.dayNumber // Obliquity of the ecliptic of Earth (idk what an obliquity is, but cool word tho!)
        var sunPos = this.calculateSunPosition(d, ecl, sOE)
        var localSiderealTime = this.calculateSiderealTime(d, sOE.meanAnomaly, sOE.perihelionArgument, localPosition.longitude)
        var spatialPosition = this.calculateSpatialPosition(body, OE)
        var geocentricRectangular = this.spatialPositionToGeocentricRectangularEclipticalCoords(
            body,
            spatialPosition.distanceToMainBody,
            spatialPosition.lonEcl,
            spatialPosition.latEcl,
            sunPos.distanceSun,
            sunPos.longSun
        )
        var equatorialCoords = this.eclipticalCoordsToEquatorialCoords(ecl, geocentricRectangular)
        var azimuthalCoordinates = this.equatorialCoordsToAzimuthalCoords(localSiderealTime, equatorialCoords, localPosition)
        var distanceUnit = (body == Body.Moon) ? DistanceUnit.EarthRadii : DistanceUnit.AU

        return {
            body: body,
            distanceUnit: distanceUnit,
            distanceToSun: spatialPosition.distanceToMainBody,
            distanceToEarth: equatorialCoords.geocentricDistance,
            magnitude: {
                apparentDiameter: 0,
                phaseAngle: 0,
                elongation: 0
            },
            riseSetTimes: {
                riseTime: new Date(),
                setTime: new Date()
            },
            eclipticalCoordinates: geocentricRectangular,
            equatorialCoordinates: equatorialCoords,
            azimuthalCoordinates: azimuthalCoordinates,
            heliocentricCoordinates: spatialPosition.heliocentricCoordinates,
            orbitalElements: OE
        }
    }

    // Returns the 3-dimensional lat-lon position in relation to the Sun (if it's a planet) or the Earth (if it's the Moon)
    public static calculateSpatialPosition(body: Body, OE: IOrbitalElements) {
        // First, solve Kepler's equation: M = e * sin(E) - E
        // meanAnomaly = eccentricity * sin(eccentricAnomaly) - eccentricAnomaly, so:
        var eccentricAnomaly = OE.meanAnomaly + OE.eccentricity * (180 / Math.PI) * Math.sin(OE.meanAnomaly) * ( 1.0 + OE.eccentricity * Math.cos(OE.meanAnomaly) ) // In degrees
        var E0 = eccentricAnomaly

        if(OE.eccentricity > 0.06) {
            var E1 = E0 - ( E0 - OE.eccentricity * (180 / Math.PI) * Math.sin(E0) - OE.meanAnomaly ) / ( 1 - OE.eccentricity * Math.cos(E0) )

            // If the eccentricity is too large, use this iteration formula for precision
            while((E0 - E1) > 0.0001 ) {
                E0 = E1
                E1 = E0 - ( E0 - OE.eccentricity * (180 / Math.PI) * Math.sin(E0) - OE.meanAnomaly ) / ( 1 - OE.eccentricity * Math.cos(E0) )
            }

            E0 = E1
        }

        var xVector = OE.semiMajorAxis * (Math.cos(E0) - OE.eccentricity)
        var yVector = OE.semiMajorAxis * (Math.sqrt(1.0 - OE.eccentricity * OE.eccentricity) * Math.sin(E0))
        var trueAnomaly = Math.atan2(yVector, xVector)

        var distanceToMainBody = Math.sqrt(xVector * xVector + yVector * yVector) // If a planet, this is the distance to the Sun (in AU), if the Moon, it's to Earth

        var xPos = distanceToMainBody * ( Math.cos(OE.ascendingNodeLong) * Math.cos(trueAnomaly + OE.perihelionArgument) - Math.sin(OE.ascendingNodeLong) * Math.sin(trueAnomaly + OE.perihelionArgument) * Math.cos(OE.inclinationEcliptic) )
        var yPos = distanceToMainBody * ( Math.sin(OE.ascendingNodeLong) * Math.cos(trueAnomaly + OE.perihelionArgument) + Math.cos(OE.ascendingNodeLong) * Math.sin(trueAnomaly + OE.perihelionArgument) * Math.cos(OE.inclinationEcliptic) )
        var zPos = distanceToMainBody * ( Math.sin(trueAnomaly + OE.perihelionArgument) * Math.sin(OE.inclinationEcliptic) )

        var lonEcl = Math.atan2(yPos, xPos)
        var latEcl = Math.atan2(zPos, Math.sqrt(xPos * xPos + yPos *yPos))

        // TODO: get heliocentric position correctly for the moon
        // if (body == Body.Moon) {
        //     xPos = xPos - 
        // }

        return {
            distanceToMainBody: distanceToMainBody,
            lonEcl: lonEcl,
            latEcl: latEcl,
            heliocentricCoordinates: {
                x: xPos,
                y: yPos,
                z: zPos
            }
        }
    }

    // Calculate actual rectangular postition in relation to the Earth
    // Correction for precession should be done before this
    public static spatialPositionToGeocentricRectangularEclipticalCoords(body: Body, distance: number, lonEcl: number, latEcl: number, distanceSun: number, lonSun: number): ISpatialCoordinates {
        var xHeliocentric = distance * Math.cos(lonEcl) * Math.cos(latEcl)
        var yHeliocentric = distance * Math.sin(lonEcl) * Math.cos(latEcl)
        var zHeliocentric = distance * Math.sin(latEcl)

        var xSun = 0
        var ySun = 0

        // If it's the Moon, we already have the geocentric position. Otherwise we have the heliocentric, and need to convert it
        if (body != Body.Moon) {
            xSun = distanceSun * Math.cos(lonSun)
            ySun = distanceSun * Math.sin(lonSun)
        }

        var xGeocentric = xHeliocentric + xSun
        var yGeocentric = yHeliocentric + ySun
        var zGeocentric = zHeliocentric

        return {
            x: xGeocentric,
            y: yGeocentric,
            z: zGeocentric
        }
    }

    // Calculate the equatorial coordinates
    public static eclipticalCoordsToEquatorialCoords(ecl: number, geo: ISpatialCoordinates): IEquatorialCoordinates {
        // Flip the coordinates to match the Earth's equator instead of the ecliptic
        var xEquatorial = geo.x
        var yEquatorial = geo.y * Math.cos(ecl) - geo.z * Math.sin(ecl)
        var zEquatorial = geo.y * Math.sin(ecl) + geo.z * Math.cos(ecl)

        // We're almost there!
        var rightAscention = Math.atan2(yEquatorial, xEquatorial)
        var declination = Math.atan2(zEquatorial, Math.sqrt(xEquatorial * xEquatorial + yEquatorial * yEquatorial))
        var geocentricDistance = Math.sqrt(xEquatorial * xEquatorial + yEquatorial * yEquatorial + zEquatorial * zEquatorial)

        return {
            rightAscention: rightAscention,
            declination: declination,
            geocentricDistance: geocentricDistance
        }
    }

    // The position in the sky from a position on Earth
    public static equatorialCoordsToAzimuthalCoords(localSiderealTime: number, eqCoords: IEquatorialCoordinates, localPos: IGeolocation): IAzimuthalCoordinates {
        var hourAngle = localSiderealTime - eqCoords.rightAscention

        var x = Math.cos(hourAngle) * Math.cos(eqCoords.declination)
        var y = Math.sin(hourAngle) * Math.cos(eqCoords.declination)
        var z = Math.sin(eqCoords.declination)

        var xHorizon = x * Math.sin(localPos.latitude) - z * Math.cos(localPos.latitude)
        var yHorizon = y
        var zHorizon = x * Math.cos(localPos.latitude) + z * Math.sin(localPos.latitude)

        var azimuth  = Math.atan2(yHorizon, xHorizon) + 180
        var altitude = Math.atan2(zHorizon, Math.sqrt(xHorizon * xHorizon + yHorizon * yHorizon))

        // TODO: correct for Moon's topocentric position
        return {
            position: localPos,
            azimuth: azimuth,
            altitude: altitude
        }
    }

    // Calculate the position of the Sun relative to the Earth
    // This is used to convert the heliocentric position into the geocentric position 
    public static calculateSunPosition(d: IDayNumberCollection, ecl: number, el: IOrbitalElements) {
        // First, compute the eccentric anomaly from the mean anomaly and from the eccentricity (anomalies in degrees)
        // This is not exact, but accurate enough for now
        var eccentricAnomaly = el.meanAnomaly + el.eccentricity * (180 / Math.PI) * Math.sin(el.meanAnomaly) * (1 + el.eccentricity * Math.cos(el.meanAnomaly))

        // Compute the Sun's distance and true anomaly
        var xVector = Math.cos(eccentricAnomaly) - el.eccentricity
        var yVector = Math.sqrt(1.0 - el.eccentricity * el.eccentricity) * Math.sin(eccentricAnomaly)
        var trueAnomaly = Math.atan2(yVector, xVector) // This is in degrees
        var distanceSun = Math.sqrt(xVector * xVector + yVector * yVector) // Distance to earth

        // Calculate the Sun's true longitude
        var longSun = trueAnomaly + el.perihelionArgument

        // Convert to ecliptic rectangular geocentric coordinates
        var xEclCoord = distanceSun * Math.cos(longSun)
        var yEclCoord = distanceSun * Math.sin(longSun)

        // Convert to equatorial rectangular geocentric coordinates
        var xEqtCoord = xEclCoord
        var yEqtCoord = yEclCoord * Math.cos(ecl)
        var zEqtCoord = yEclCoord * Math.sin(ecl)

        // Finally, compute the RA and Dec! 🎉🎉
        var rightAscention = Math.atan2(yEqtCoord, xEqtCoord)
        var declination = Math.atan2(zEqtCoord, Math.sqrt(xEqtCoord * xEqtCoord + yEqtCoord * yEqtCoord))

        return {
            rightAscention: rightAscention, // TODO: Check if this returns hours or degrees
            declination: declination,
            distanceSun: distanceSun,
            longSun: longSun
        }
    }

    // Calc the Right Ascention of your local meridian (https://www.localmeridian.com/2015/05/what-is-the-local-meridian/) AKA the Sidereal Time (in degrees)
    // So kinda where you are on Earth, but only one axis
    public static calculateSiderealTime(d: IDayNumberCollection, meanAnomaly: number, perihelionArgument: number, longitude: number): number {
        var meanLongSun = meanAnomaly + perihelionArgument

        // gmst = Greenwich Mean Sidereal Time
        var gmst0 = meanLongSun + 180 // (degrees)
        var gmst = gmst0 + d.decimalTime
        var sideRealTime = gmst + longitude

        return sideRealTime
    }

    // Calculate apparent size and brightness
    public static calculateMagnitude(): IMagnitude {
        throw "Not implemented"
    }

    // Get planet data from BodyLocationConstants.ts
    private static getOrbitalElementPrimitives(body: Body): IOrbitalElementsPrimitive {
        switch(body) {
            case Body.Sun:
                return AllOrbitalElementPrimitives.Sun
            case Body.Moon:
                return AllOrbitalElementPrimitives.Moon
            case Body.Mercury:
                return AllOrbitalElementPrimitives.Mercury
            case Body.Venus:
                return AllOrbitalElementPrimitives.Venus
            case Body.Mars:
                return AllOrbitalElementPrimitives.Mars
            case Body.Jupiter:
                return AllOrbitalElementPrimitives.Jupiter
            case Body.Saturn:
                return AllOrbitalElementPrimitives.Saturn
            case Body.Uranus:
                return AllOrbitalElementPrimitives.Uranus
            case Body.Neptune:
                return AllOrbitalElementPrimitives.Neptune
            default:
                throw "No known body!"
        }
    }

    // Make calculations to calculate all standard 
    private static initialOrbitalElementsCalculations(p: IOrbitalElementsPrimitive, d: number, body: Body): IOrbitalElements {
        var ascendingNodeLong = p.ascendingNodeLongBase + (p.ascendingNodeLongModifier * d)
        var inclinationEcliptic = p.inclinationEclipticBase + (p.inclinationEclipticModifier * d)
        var perihelionArgument = p.perihelionArgumentBase + (p.perihelionArgumentModifier * d)
        var semiMajorAxis = p.semiMajorAxisBase + (p.semiMajorAxisModifier * d)
        var eccentricity = p.eccentricityBase + (p.eccentricityModifier * d)
        var meanAnomaly = p.meanAnomalyBase + (p.meanAnomalyModifier * d)

        // Mean anomaly must be positive and not bigger than 360
        // This could be so much more efficient btw
        while (meanAnomaly < 0 || meanAnomaly > 360) {
            if (meanAnomaly < 0) {
                meanAnomaly += 360
            }
            if (meanAnomaly > 360) {
                meanAnomaly -= 360
            }
        }

        // The Moon must have these checked too
        // Maybe other bodies later as well?
        if (body === Body.Moon) {
            while (perihelionArgument < 0 || perihelionArgument > 360) {
                if (perihelionArgument < 0) {
                    perihelionArgument += 360
                }
                if (perihelionArgument > 360) {
                    perihelionArgument -= 360
                }
            }

            while (ascendingNodeLong < 0 || ascendingNodeLong > 360) {
                if (ascendingNodeLong < 0) {
                    ascendingNodeLong += 360
                }
                if (ascendingNodeLong > 360) {
                    ascendingNodeLong -= 360
                }
            }
        }

        var perihelionLongitude = ascendingNodeLong + perihelionArgument

        return {
            ascendingNodeLong: ascendingNodeLong,
            inclinationEcliptic: inclinationEcliptic,
            perihelionArgument: perihelionArgument,
            semiMajorAxis: semiMajorAxis,
            eccentricity: eccentricity,
            meanAnomaly: meanAnomaly,
            perihelionLongitude: perihelionLongitude,
            perihelionDistance: semiMajorAxis * (1 - eccentricity),
            aphelionDistance: semiMajorAxis * (1 + eccentricity),
            meanLongitude: meanAnomaly + perihelionLongitude,
            orbitalPeriod: semiMajorAxis ^ 1.5,
            perihelionTime: null, // 
            eccentricAnomaly: null, // <--- I'll calc U later 😎
            trueAnomaly: null // 
        }
    }
}