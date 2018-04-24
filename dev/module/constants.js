
const constants = {
  parseYYYMMDD: d3.timeParse("%Y-%m-%d"),
  formatShortDate: d3.timeFormat("%b %d, %Y"),
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
  }
}
