import requests
from requests.auth import HTTPProxyAuth

proxy_string = 'http://1130093@Tcs@12345@proxy.tcs.com:8080'

s = requests.Session()
s.proxies = {"http": proxy_string , "https": proxy_string}
s.auth = HTTPProxyAuth(1130093,"Tcs@12345") 
dat=requests.get('https://jsonplaceholder.typicode.com/todos/1')
#dat = requests.get('http://www.google.com')
print( dat.text)