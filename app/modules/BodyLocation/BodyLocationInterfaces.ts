import { IGeolocation } from '../GeoLocation/GeolocationService'
import { Body } from '../BodyLocation/BodyLocationService'

export interface ISpatialCoordinates {
    x: number,
    y: number,
    z: number,
    center?: Body
}

// Body position in relation to Earth equator
export interface IEquatorialCoordinates {
    rightAscention: number,
    declination: number,
    geocentricDistance: number
}

// Body position in relation to a position on Earth
export interface IAzimuthalCoordinates {
    position?: IGeolocation,
    azimuth: number,
    altitude: number
}

// All available info from a body, in one handy package!
export interface IBodyInfo {
    distanceToSun: number,
    distanceToEarth: number,
    magnitude: IMagnitude,
    riseSetTimes: IRiseSetTimes,
    eclipticalCoordinates: ISpatialCoordinates,
    equatorialCoordinates: IEquatorialCoordinates,
    azimuthalCoordinates: IAzimuthalCoordinates,
    orbitalElements: IOrbitalElements
}

// When a body goes above and below the horizon
export interface IRiseSetTimes {
    riseTime: Date,
    setTime: Date
}

// The date of a position calculation
// Decimal time is included in calculation of day number
// But is needed seperately sometimes
export interface IDayNumberCollection {
    dayNumber: number,
    decimalTime: number
}

// How it is viewed from Earth (brightness, size etc)
export interface IMagnitude {
    apparentDiameter: number, // How big it looks, in arcseconds
    phaseAngle: number, // If 0, the planet is like the full moon, 90 is like half moon, 180 is like new moon (harder to view)
    elongation: number // The angle the body is in relation to the sun: > 20deg is hard to view, > 10 is impossible
}

// All base parameters of a body's orbit
export interface IOrbitalElementsPrimitive {
    ascendingNodeLongBase: number,
    ascendingNodeLongModifier: number,
    inclinationEclipticBase: number,
    inclinationEclipticModifier: number,
    perihelionArgumentBase: number,
    perihelionArgumentModifier: number,
    semiMajorAxisBase: number, // Usually in AU, except for the Moon, then it's in Earth radii
    semiMajorAxisModifier: number, // Usually 0, except for Uranus (lol) and Neptune
    eccentricityBase: number, // (0 = circle, 0-1 = ellipse, 1 = parabola)
    eccentricityModifier: number,
    meanAnomalyBase: number,
    meanAnomalyModifier: number
}

// IOrbitalElementsPrimitive data will be converted to this with day number
export interface IOrbitalElements {
    ascendingNodeLong: number,
    inclinationEcliptic: number,
    perihelionArgument: number,
    semiMajorAxis: number,
    eccentricity: number,
    meanAnomaly: number,
    perihelionLongitude: number,
    perihelionDistance: number,
    perihelionTime: number,
    aphelionDistance: number,
    eccentricAnomaly: number,
    trueAnomaly: number,
    meanLongitude: number,
    orbitalPeriod: number // In years if semiMajorAxis is in AU
}
