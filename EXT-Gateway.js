/**
 ** Module : EXT-Gateway
 ** @bugsounet
 ** ©01-2022
 ** support: http://forum.bugsounet.fr
 **/

logGW = (...args) => { /* do nothing */ }

Module.register("EXT-Gateway", {
  defaults: {
    debug: true
  },

  start: function () {
    if (this.config.debug) logGW = (...args) => { console.log("[GATEWAY]", ...args) }

  },

  getScripts: function() {
    return [ ]
  },

  getStyles: function () {
    return [
      "EXT-Gateway.css",
      "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
    ]
  },

  getDom: function() {
    var dom = document.createElement("div")
    dom.style.display = 'none'
    return dom
  },

  notificationReceived: function(noti, payload) {
    switch(noti) {
      case "DOM_OBJECTS_CREATED":
        this.sendSocketNotification("INIT", this.config)
        break
    }
  },

  socketNotificationReceived: function(noti, payload) {
    switch(noti) {
   
    }    
  }
})
