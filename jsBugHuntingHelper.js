// Created by Davide Cavallini
// linkedin: https://www.linkedin.com/in/davidecavallini/

// This tool is studied to help Ethical Hackers to find vulnerable points in webpage's javascript
// Just open the webpage, select all this code, copy and past in browser's console

'use strict'

var xssScanEnabled = false

var alreadyProcessedFunctions = []


function SearchElement(description, type, string) {
  this.description = description;
  this.type = type;
  this.string = string;
}

// eslint-disable-next-line prefer-const, no-var
var searchElements = [
  new SearchElement('form', 'string', '<form'),
  new SearchElement('url', 'string', 'http://'),
  new SearchElement('url', 'string', 'https://'),
  new SearchElement('web socket', 'string', 'ws://'),
  new SearchElement('web socket', 'string', 'wss://'),
  //new SearchElement('single line comment', 'string', ' //'),
  //new SearchElement('block comment', 'string', '/*'),
  new SearchElement('post request', 'string', '"POST"'),
  new SearchElement('get request', 'string', '"GET"'),
  new SearchElement('post request', 'string', "'POST"),
  new SearchElement('get request', 'string', "'GET'"),
  new SearchElement('ajax request', 'string', '.ajax'),
  new SearchElement('post request', 'string', '$.post'),
  new SearchElement('get request', 'string', '$.get'),
  new SearchElement('query', 'string', 'query'),
  new SearchElement('api call', 'string', '/api'),
  new SearchElement('php file', 'string', '.php'),
  new SearchElement('asp file', 'string', '.asp'),
  new SearchElement('json file', 'string', '.json'),
  new SearchElement('mailto protocol', 'string', 'mailto:'),
  new SearchElement('something on mysql', 'string', 'mysql'),
  new SearchElement('something on email', 'string', 'email'),
  new SearchElement('something on username', 'string', '"username"'),
  new SearchElement('something on username', 'string', '"user"'),
  new SearchElement('something on password', 'string', '"password"'),
  new SearchElement('something on password', 'string', '"pass"'),
  new SearchElement('something on password', 'string', '"psw"'),
  new SearchElement('something on password', 'string', '"pwd"')]
  new SearchElement('REGEX email address', 'regEx', /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
  new SearchElement('REGEX API Key', 'regEx', /^[a-f0-9]{32}$/)
  
  function getAllUrlParams(url) {

    // get query string from url (optional) or window
    var queryString = url ? url.split('?')[1] : window.location.search.slice(1);
  
    // we'll store the parameters here
    var obj = {};
  
    // if query string exists
    if (queryString) {
  
      // stuff after # is not part of query string, so get rid of it
      queryString = queryString.split('#')[0];
  
      // split our query string into its component parts
      var arr = queryString.split('&');
  
      for (var i = 0; i < arr.length; i++) {
        // separate the keys and the values
        var a = arr[i].split('=');
  
        // set parameter name and value (use 'true' if empty)
        var paramName = a[0];
        var paramValue = typeof (a[1]) === 'undefined' ? true : a[1];
  
        // (optional) keep case consistent
        paramName = paramName.toLowerCase();
        if (typeof paramValue === 'string') paramValue = paramValue.toLowerCase();
  
        // if the paramName ends with square brackets, e.g. colors[] or colors[2]
        if (paramName.match(/\[(\d+)?\]$/)) {
  
          // create key if it doesn't exist
          var key = paramName.replace(/\[(\d+)?\]/, '');
          if (!obj[key]) obj[key] = [];
  
          // if it's an indexed array e.g. colors[2]
          if (paramName.match(/\[\d+\]$/)) {
            // get the index value and add the entry at the appropriate position
            var index = /\[(\d+)\]/.exec(paramName)[1];
            obj[key][index] = paramValue;
          } else {
            // otherwise add the value to the end of the array
            obj[key].push(paramValue);
          }
        } else {
          // we're dealing with a string
          if (!obj[paramName]) {
            // if it doesn't exist, create property
            obj[paramName] = paramValue;
          } else if (obj[paramName] && typeof obj[paramName] === 'string'){
            // if property does exist and it's a string, convert it to an array
            obj[paramName] = [obj[paramName]];
            obj[paramName].push(paramValue);
          } else {
            // otherwise add the property
            obj[paramName].push(paramValue);
          }
        }
      }
    }
  
    return obj;
  }
  

  function getjQueryEventHandlers(element, eventns) {
    const $ = window.jQuery;
    const i = (eventns || '').indexOf('.'),
      event = i > -1 ? eventns.substr(0, i) : eventns,
      namespace = i > -1 ? eventns.substr(i + 1) : void(0),
      handlers = Object.create(null);
    element = $(element);
    if (!element.length) return handlers;
    // gets the events associated to a DOM element
    const listeners = $._data(element.get(0), "events") || handlers;
    const events = event ? [event] : Object.keys(listeners);
    if (!eventns) return listeners; // Object with all event types
    events.forEach((type) => {
      // gets event-handlers by event-type or namespace
      (listeners[type] || []).forEach(getHandlers, type);
    });
    // eslint-disable-next-line
    function getHandlers(e) {
      const type = this.toString();
      const eNamespace = e.namespace || (e.data && e.data.handler);
      // gets event-handlers by event-type or namespace
      if ((event === type && !namespace) ||
          (eNamespace === namespace && !event) ||
          (eNamespace === namespace && event === type)) {
        handlers[type] = handlers[type] || [];
        handlers[type].push(e);
      }
    }
    return handlers;
  }

  function listAllEventListeners() {
    const allElements = Array.prototype.slice.call(document.querySelectorAll('*'));
    allElements.push(document);
    allElements.push(window);
  
    const types = [];
  
    for (let ev in window) {
      if (/^on/.test(ev)) types[types.length] = ev;
    }
  
    let elements = [];
    for (let i = 0; i < allElements.length; i++) {
      const currentElement = allElements[i];
      for (let j = 0; j < types.length; j++) {
        if (typeof currentElement[types[j]] === 'function') {
          elements.push(currentElement[types[j]])
        } 
      }
    }
  
    return elements/* .sort(function(a,b) {
      return a.type.localeCompare(b.type);
    }); */
  }

function regexIndexOf(string, regex, startpos) {
  var indexOf = string.substring(startpos || 0).search(regex);
  return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}

function regexAllIndexOf(string, regex, startpos) {

  regex = (regex.global) ? regex : new RegExp(regex.source, "g" + (regex.ignoreCase ? "i" : "") + (regex.multiLine ? "m" : ""));
  if(typeof (startpos) == "undefined") {
      startpos = string.length;
  } else if(startpos < 0) {
      startpos = 0;
  }
  var stringToWorkWith = string.substring(0, startpos + 1);
  var lastIndexOf = -1;
  var nextStop = 0;
  while((result = regex.exec(stringToWorkWith)) != null) {
      lastIndexOf = result.index;
      regex.lastIndex = ++nextStop;
      indexes.push(lastIndexOf)
  }
  return lastIndexOf;
}

function getAllIndexes (arr, val) {
  const indexes = []; let i = -1
  while ((i = arr.indexOf(val, i + 1)) !== -1) {
    indexes.push(i)
  }
  return indexes
}

function searchInside (functionToString, object, objKeys, o, level) {
  if(objKeys[o] === undefined) {
    objKeys[o] = ''
  }
  if(object[objKeys[o]] === undefined) {
    object[objKeys[o]] = ''
  }
  
  searchElements.forEach((v) => {
    if(v.type === 'string') {
      const index = getAllIndexes(functionToString, v.string)
      index.forEach((ind) => {
        console.log('DDDX ' + v.description, level, objKeys[o], object[objKeys[o]], functionToString.substr(ind - 15, 60))
      })
    } else if(v.type === 'regEx'){
      const index =  regexAllIndexOf(functionToString, v.string, 0)
      index.forEach((ind) => {
        console.log('DDDX regEx ' + v.description, level, objKeys[o], object[objKeys[o]], functionToString.substr(ind - 15, 60))
      })
    }
  })
}

function recursiveEnumerate (object, level) {

  level++
  const objKeys = Object.keys(object)
  // console.log("A", object)

  for (let o = 0; o < objKeys.length; o++) {
    if (object[objKeys[o]] !== null && (typeof object[objKeys[o]] === 'function' || typeof object[objKeys[o]] === 'object') && objKeys[o] !== 'recursiveEnumerate' && objKeys[o] !== 'alreadyProcessedFunctions') {
      

      try {
        const functionToString = object[objKeys[o]].toString().replace(/(\r\n|\n|\r)/gm, '').replace(/\s\s+/g, ' ')

        // console.log("B", functionToString)

        if(alreadyProcessedFunctions.indexOf(functionToString) === -1){
          // console.log("C", functionToString)
          searchInside(functionToString, object, objKeys, o, level)

          if(functionToString.indexOf('[object Object]')===-1){
          alreadyProcessedFunctions.push(functionToString)
        }
          
          if (objKeys[o] !== 'set' && objKeys[o] !== 'push') {
            recursiveEnumerate(object[objKeys[o]], level)
          }
        }
      } catch (e) {

      }
    }
  }
}

function searchJqueryListeners () {
  var jQueryListeners = []
  $( "*" ).each((i,v)=>
    {
      const elementListeners = getjQueryEventHandlers(v)
       //console.log(Object.values(elementListeners))
      if(Object.keys(elementListeners).length > 0) {
        jQueryListeners.push(elementListeners)
      }
    })
  //console.log(jQueryListeners)
  recursiveEnumerate(jQueryListeners, 0)
}

async function testUrlParamFiltering () {
  const params = getAllUrlParams(document.location.href)

  const mod = Object.entries(params).map((v) => {
    return v[0] + '=' + v[1] + '"><script>console.log("PARAMETRO_VULNERABILE_XSS")</script><'
  })

  const newUrl= document.location.origin + document.location.pathname + '?' + mod.join('&')

  await $.get(newUrl).done(function( data ) {
    if(data.indexOf('PARAMETRO_VULNERABILE_XSS')!==-1){
      console.log('Parametri Vulnerabili ad attachi XSS')
      console.log(data)
    }
  })
}

console.log('Created by Davide Cavallini')
console.log('Linkedin: https://www.linkedin.com/in/davidecavallini/')
console.log('----------------------------------------------------------')
console.log('\n') 


recursiveEnumerate(window, 0)
recursiveEnumerate(listAllEventListeners(), 0)
searchInside(document.body.innerHTML.replace(/(\r\n|\n|\r)/gm, '').replace(/\s\s+/g, ' '), document.body, ['BODY'], 0, 0)
recursiveEnumerate(getjQueryEventHandlers(document), 0)
searchJqueryListeners()
console.log('Contenuto cookie', document.cookie)
if(xssScanEnabled === true){
testUrlParamFiltering()
}

console.log('\n')
console.log('----------------------------------------------------------')
console.log('Created by Davide Cavallini')
console.log('Linkedin: https://www.linkedin.com/in/davidecavallini/')