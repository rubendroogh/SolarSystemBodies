<template>
	<Page androidStatusBarBackground="#121212">
		<ActionBar title="Ruimtekiekert" backgroundColor="#121212"/>
		<TabView androidTabsPosition="bottom">
			<TabViewItem title="All current positions">
				<StackLayout>
					<AbsoluteLayout id="solarSystem" class="solarsystem" minHeight="500">
						<Label
							class="sun"
							:left="screen.widthDIPs / 2"
							:top="screen.heightDIPs / 3"
						/>
						<Label
							v-for="(body, index) in allBodyPoints" v-bind:key="`b-${index}`" class="planet"
							:left="(body.heliocentricCoordinates.x * 5) + (screen.widthDIPs / 2)"
							:top="(body.heliocentricCoordinates.y * 5) + (screen.heightDIPs / 3)"
							:backgroundColor="body.color"
						/>
					</AbsoluteLayout>
					<Label class="dont-use-slider" text="Don't use this slider, the app will crash lmao"/>
					<Slider value="50" @valueChange="onZoomLevelChanged" />
		  		</StackLayout>
			</TabViewItem>
			<TabViewItem title="Single body info">
				<StackLayout>
					<Label fontSize="20" textDecoration="underline" text="Info" />
					<Label :text="'Location: ' + locationName" />
					<Label :text="'Day number: ' + dayNumber" />
					<Label :text="'Distance to Sun: ' + bodyInfo.distanceToSun" />
					<Label :text="'Distance to Earth: ' + bodyInfo.distanceToEarth" />
					<Label fontSize="20" textDecoration="underline" text="Body" />
					<TextField v-model="stringBody" />
					<Label fontSize="20" textDecoration="underline" text="Date" />
					<DatePicker v-model="selectedDate" />
					<GridLayout columns="*, *" rows="*">
						<Button col="0" text="Current date/time" @tap="getCoords(true)" margin="5" />
						<Button col="1" text="Input date" @tap="getCoords(false)" margin="5" />
					</GridLayout>
		  		</StackLayout>
			</TabViewItem>
	  	</TabView>
	</Page>
</template>

<script lang="ts">
import LocationService from "../modules/Geolocation/GeolocationService"
import WeatherService from "../modules/Weather/WeatherService"
import BodyLocationService from "../modules/BodyLocation/BodyLocationService"
import UtilityService from "../modules/Utility/UtilityService"
import { Body } from "../modules/BodyLocation/BodyLocationService"
import { IBodyInfo } from "../modules/BodyLocation/BodyLocationInterfaces"
import { device, screen, isAndroid, isIOS } from "tns-core-modules/platform";
import { AbsoluteLayout } from 'tns-core-modules/ui/layouts/absolute-layout';

export default {
	data() {
		return {
			location: {},
			locationName: '',
			dayNumber: '',
			selectedDate: new Date(),
			bodyInfo: { distanceToSun: 0, distanceToEarth: 0},
			stringBody: 'Mars',
			selectedBody: Body.Sun,
			allBodyPoints: [{
			heliocentricCoordinates: {
					x: 0,
					y: 0,
					z: 0
				}
			}],
			screen: screen.mainScreen
		}
	},
	mounted() {
		LocationService.checkLocationPermission().then( available => {
			if(available) {
				LocationService.getLocation().then( location => {
					this.locationName = `${location.latitude}, ${location.longitude}`
					this.location = location
					this.getAllBodyPoints()
					LocationService.getLocationName(location).then( name => {
						this.locationName = name
					})
				})
			}
		})
	},
	methods: {
		getCoords(currentDate: boolean = false) {
				var d = (currentDate) ? BodyLocationService.getCurrentDayNumber() : BodyLocationService.getDayNumber(this.selectedDate)
				this.changeBody()
				this.dayNumber = d.dayNumber
				this.bodyInfo = BodyLocationService.calculateBodyInfo(this.selectedBody, d, this.location)
		},
		getAllBodyPoints() {
			// Loop through body enum to get all planets
			for (let planet in Body) {
				if (!isNaN(Number(planet))) {
					let d = BodyLocationService.getCurrentDayNumber()
					let bodyInfo = BodyLocationService.calculateBodyInfo(Number(planet), d, this.location)
					let bodyAndPointInfo = {
					...bodyInfo,
					...{"color": UtilityService.getRandomHexColor()}
					}
					if (planet != "Moon") {
					this.allBodyPoints.push(bodyAndPointInfo)
					}
				}
			}
		},
		changeBody() {
			switch (this.stringBody.trim().toLowerCase()) {
				case 'sun':
					this.selectedBody = Body.Sun
					break;
				case 'mercury':
					this.selectedBody = Body.Mercury
					break;
				case 'venus':
					this.selectedBody = Body.Venus
					break;
				case 'moon':
					this.selectedBody = Body.Moon
					break;
				case 'mars':
					this.selectedBody = Body.Mars
					break;
				case 'jupiter':
					this.selectedBody = Body.Jupiter
					break;
				case 'saturn':
					this.selectedBody = Body.Saturn
					break;
				case 'uranus':
					this.selectedBody = Body.Uranus
					break;
				case 'neptune':
					this.selectedBody = Body.Neptune
					break;
			}
		},
		onZoomLevelChanged(args) {
			const view = require("tns-core-modules/ui/core/view");
			let solarSystem = <AbsoluteLayout>view.getViewById("solarSystem")
			console.dir(args)
			console.dir(solarSystem)
			solarSystem.animate({
				scale: { x: 2, y: 2},
				duration: 3000
			})
		}
	}
}
</script>

<style scoped>
  Label{
	margin: 5;
	margin-left: 10;
  }
  .header{
	margin-left: 10;
  }
  .solarsystem{
	  border-width: 2;
	  border-color: #151515
  }
  .sun{
	border-radius: 5;
	background-color: #f3b711;
	width: 10;
	height: 10;
	z-index: 500;
  }
  .planet{
	border-radius: 5;
	width: 7;
	height: 7;
  }
  .dont-use-slider{
	text-align: center;
	width: 100%;
  }
</style>
