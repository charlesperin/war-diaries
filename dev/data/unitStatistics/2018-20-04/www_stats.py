# -*- coding: utf-8 -*-
"""
Created on Thu Apr 19 12:15:42 2018

@author: johannes
"""
import os
import pandas as pd
import numpy as np
from functools import reduce
import json


os.chdir("C:\data\wardiaries\war diaries data\Tab Delimited Exports\merged_csv")

activities = pd.read_csv("activities.csv", encoding="latin-1")
person = pd.read_csv("person.csv", encoding="latin-1")
place = pd.read_csv("place.csv", encoding="latin-1")
#placeGeoname = 

filter_col_activity = [col for col in activities if col.startswith('activity:')]
filter_col_domestic = [col for col in activities if col.startswith('domestic:')]

activities['activity_count'] = activities[filter_col_activity].count(axis=1)
activities['domestic_count'] = activities[filter_col_domestic].count(axis=1)

actExport = activities[['#Unit', 'Date', 'activity_count']][activities.activity_count != 0]
domExport = activities[['#Unit', 'Date', 'domestic_count']][activities.domestic_count != 0]


groupedAct = actExport.groupby(['#Unit', 'Date']).sum()
groupedDom = domExport.groupby(['#Unit', 'Date']).sum()

actDF = groupedAct.reset_index()
domDF = groupedDom.reset_index()

person['person_count'] = 1
persExport = person[['#Unit', 'Date', 'person_count']]
groupedPers = persExport.groupby(['#Unit', 'Date']).sum()
persDF = groupedPers.reset_index()

place['place_mentioned_count'] = 1
plExport = place[['#Unit', 'Date', 'place_mentioned_count']]
groupedPl = plExport.groupby(['#Unit', 'Date']).sum()
plDF = groupedPl.reset_index()

#plac

#res = pd.merge(actDF, domDF, how="outer", on=['#Unit', 'Date'])

dfs = [actDF, domDF, persDF, plDF]

df_final = reduce(lambda left,right: pd.merge(left,right,on=['#Unit', 'Date'], how="outer"), dfs)
df_final.fillna(0, inplace=True)
df_final.rename(index=str, columns={"Date": "date"}, inplace=True)

www = []
for name, group in df_final.groupby("#Unit"):
    gSort = group.sort_values(by=['date'])
    unitDict = {}
    unitDict['unit'] = name
    unitDict['first_date'] = gSort['date'].min()
    unitDict['last_date'] = gSort['date'].max()
    unitDict['timeseries'] = []
    for idx, row in gSort.iterrows():
        unitDict['timeseries'].append(row[['date', 'activity_count', 'domestic_count', 'person_count', 'place_mentioned_count']].to_dict())
        
    www.append(unitDict)

with open('data.json', 'w') as outfile:
    json.dump(www, outfile, indent=4, sort_keys=False, separators=(',', ': '), ensure_ascii=False)
    
    
with open('data_test.json', 'w') as outfile:
    json.dump(test, outfile, indent=4, sort_keys=False, separators=(',', ': '), ensure_ascii=False)