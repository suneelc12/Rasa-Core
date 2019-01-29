from rasa_core_sdk import Action 
from rasa_core_sdk.events import SlotSet
import requests
from pymongo import MongoClient

class Actionconnecttodb(Action):
    
    def name(self):
        return 'action_calldb'

    def run(self,dispatcher,tracker,domain):

      client = MongoClient("mongodb://localhost:27017/")
      db=client.botdb
      return_slots = []
      result=db.faq.find_one({'Intent':'GIS'})
      print('mongo result',result)
      return_slots.append(SlotSet('enabled',result.get('Intent')))
      return return_slots


class ActionEnabled(Action):
    
    def name(self):
        return 'action_isenabled'

    def run(self,dispatcher,tracker,domain):
      return_slots = []
      details = ['userid']
      data=requests.get('https://jsonplaceholder.typicode.com/todos/1').json()
      print("server response"+data.get('title'))
      for detail in details:
        if tracker.get_slot(detail) == 'abel.tuter':
          return_slots.append(SlotSet('enabled','NULL'))
          print('enabled staus',return_slots[0]) 
        else:
          return_slots.append(SlotSet('enabled','EXIST'))  
      return return_slots