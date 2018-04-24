
const constants = {
  parseYYYMMDD: d3.timeParse("%Y-%m-%d"),
  formatShortDate: d3.timeFormat("%b %d, %Y"),
  fileName:
  "statistics_for_www_data",
  //"statistics_for_www_data_first10",
  color: {
    statistics: {
      activity: "#66c2a5",
      domestic: "#fc8d62",
      person: "#8da0cb",
      place: "#e78ac3"
    }
  },
  histogram: {
    nbBins: 6,
    tmpMaxValue: 2000
  },
  unitFilter: {
    minActivities: 500,
    minDomestic: 500,
    minPersons: 500,
    minPlaces: 500,
    maxActivitiesADay: 50,
    maxDomesticADay: 50,
    maxPersonsADay: 50,
    maxPlacesADay: 50
  }
}
