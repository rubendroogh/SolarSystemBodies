<template>
    <Page>
      <TabView androidTabsPosition="bottom">
        <TabViewItem title="All current positions">
          <AbsoluteLayout>
            <Label v-for="(index, body) in allBodies" v-bind:key="`b-${index}`" class="planet" />
          </AbsoluteLayout>
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
  import { Body } from "../modules/BodyLocation/BodyLocationService"
  import { IBodyInfo } from "../modules/BodyLocation/BodyLocationInterfaces"

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
        allBodies: []
      }
    },
    mounted() {
      this.getAllBodyCoords()
      LocationService.checkLocationPermission().then( available => {
        if(available) {
          LocationService.getLocation().then( location => {
            this.locationName = `${location.latitude}, ${location.longitude}`
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
      getAllBodyCoords() {
        // Loop trough body enum to get all planets
        for (let planet in Body) {
            if (!isNaN(Number(planet))) {
              // get planet info
              // get planet position
              var d = BodyLocationService.getCurrentDayNumber()
              BodyLocationService.calculateSpatialPosition(Number(planet), BodyLocationService.calculateBodyInfo(Number(planet), d, this.location))
              // spawn actual dot
              console.log(planet);
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
  .planet{
    border-radius: 5;
    background-color: #f3b711;
    width: 10;
    height: 10;
  }
</style>
