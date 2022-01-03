/**
 ** Module : EXT-Gateway
 ** @bugsounet
 ** ©01-2022
 ** support: http://forum.bugsounet.fr
 **/

logGW = (...args) => { /* do nothing */ }

Module.register("EXT-Gateway", {
  defaults: {
    debug: true,
    /** to code ... something like this for other modules
    newExt: [
      {
        notification: "Working", // received noti
        payload: null, // received payload
        screenLock: true,  // lock the screen
        stop: true // stop all EXT module
      },
      {
        notification: "NotWorking",
        payload: null,
        screenLock: false,
        stop: false
      },
    ]
    **/
  },

  start: function () {
    if (this.config.debug) logGW = (...args) => { console.log("[GATEWAY]", ...args) }
    this.ready = false
  },

  getScripts: function() { // maybe with class ?
    return [ ]
  },

  getDom: function() {
    var dom = document.createElement("div")
    dom.style.display = 'none'
    return dom
  },

  notificationReceived: function(noti, payload) {
    if (noti.startsWith("ASSISTANT_")) return this.ActionsOnStatus(noti)
    switch(noti) {
      case "DOM_OBJECTS_CREATED":
        this.sendSocketNotification("INIT", this.config)
        break
    case "GA_READY":
        this.ready = true
        logGW("EXT-Gateway is ready!")
        break
    }
  },

  /***********************/
  /** GA Status Gateway **/
  /***********************/

  ActionsOnStatus: function(status) {
    if (!this.ready) return console.log("[GATEWAY] MMM-GoogleAssistant is not ready")
    logGW("Received GA status:", status)
    switch(status) {
      case "ASSISTANT_LISTEN":
      case "ASSISTANT_THINK":
        this.sendNotification("EXT_SCREEN_WAKEUP") // wakeup the screen
        this.sendNotification("EXT_SCREEN_LOCK") // lock the screen
        /** to code...
        this.sendNotification("YT_VOLUME_MIN")
        this.sendNotification("SPOTIFY_VOLUME_MIN")
        this.sendNotification("MUSIC_VOLUME_MIN")
        this.sendNotification("RADIO_MIN")
        **/
        break
      case "ASSISTANT_HOOK":
      case "ASSISTANT_STANDBY":
        this.sendNotification("EXT_SCREEN_UNLOCK") // unlock the screen
        /** to code ...
        this.sendNotification("YT_VOLUME_MAX")
        this.sendNotification("SPOTIFY_VOLUME_TARGET")
        this.sendNotification("MUSIC_VOLUME_MAX")
        this.sendNotification("RADIO_MAX")
        **/
        break
      case "ASSISTANT_REPLY":
      case "ASSISTANT_CONTINUE":
      case "ASSISTANT_CONFIRMATION":
      case "ASSISTANT_ERROR":
        break
    }
  }
})
