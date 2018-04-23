Structure of Statistics for WWW

[
    {
        "unit": "1 CAVALRY DIVISION:  2 Cavalry Brigade: 4 Dragoon Guards.", //Unit Name
        "first_date": "1914-08-15", //First Date
        "last_date": "1919-03-31", //Last Date
        "timeseries": [ //Dates in temporal order
            {
                "date": "1914-08-15", //Date
                "activity_count": 2.0, //Number of activities in activitiy.csv for Unit and Date
                "domestic_count": 0.0, //Number of domestic in activitiy.csv for Unit and Date
                "person_count": 0.0, //Number of People in person.csv for Unit and Date
                "place_mentioned_count": 1.0 //Number of Places in place.csv for Unit and Date (!!! Important: this does not take Geonames into account, just if any place is mentioned for Unit at Date !!!)
            },
            ...
            {
                "date": "1919-03-31",
                "activity_count": 0.0,
                "domestic_count": 0.0,
                "person_count": 1.0,
                "place_mentioned_count": 0.0
            }
        ]
    },
    ...
    {
        //UNIT
    }
]