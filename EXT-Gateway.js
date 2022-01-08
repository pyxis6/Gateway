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
    this.GW = {
      spotify: {
        useSpotify: false,
        connected: false
      },
      screen: {
        useScreen: false
      },
      youtube: {
        useYouTube: false
      },
      links: {
        useLinks: false
      },
      photos: {
        usePhotos: false
      },
      radio: {
        useRadio: false
      },
      music: {
        useMusic: false
      }
    }
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
    if (noti.startsWith("EXT_")) return this.ActionsOnExt(noti,payload)
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
        this.sendNotification("EXT_SPOTIFY_VOLUME_MIN")
        /** to code...
        this.sendNotification("EXT_YT-CVLC_VOLUME_MIN")
        this.sendNotification("EXT_MUSIC_VOLUME_MIN")
        this.sendNotification("EXT_RADIO_MIN")
        **/
        break
      case "ASSISTANT_HOOK":
      case "ASSISTANT_STANDBY":
        this.sendNotification("EXT_SCREEN_UNLOCK") // unlock the screen
        this.sendNotification("EXT_SPOTIFY_VOLUME_MAX")
        /** to code ...
        this.sendNotification("EXT_YT-CVLC_VOLUME_MAX")
        this.sendNotification("EXT_MUSIC_VOLUME_MAX")
        this.sendNotification("EXT_RADIO_MAX")
        **/
        break
      case "ASSISTANT_REPLY":
      case "ASSISTANT_CONTINUE":
      case "ASSISTANT_CONFIRMATION":
      case "ASSISTANT_ERROR":
        break
    }
  },

  /*****************/
  /** Ext Gateway **/
  /*****************/

  ActionsOnExt: function(noti,payload) {
    //logGW("Received EXT noti:", noti)
    switch(noti) {
      case "EXT_HELLO":
        this.helloEXT(payload)
        //logGW(this.GW)
        break
      case "EXT_STOP":
      break
    }
  },

  /** Activate automaticaly any plugins **/
  helloEXT: function(module) {
    console.log(module)
    switch (module) {
      case "EXT-Spotify":
        this.GW.spotify.useSpotify= true
        logGW("Hello,", module)
        break
      case "EXT-NewPIR":
        this.GW.screen.useScreen= true
        logGW("Hello,", module)
        break
      case "EXT-Links":
        this.GW.links.useLinks= true
        logGW("Hello,", module)
        break
      case "EXT-GooglePhotos":
        this.GW.photos.usePhotos= true
        logGW("Hello,", module)
        break
      case "EXT-RadioPlayer":
        this.GW.radio.useRadio= true
        logGW("Hello,", module)
        break
      case "EXT-MusicPlayer":
        this.GW.music.useMusic= true
        logGW("Hello,", module)
        break
    }
  }
})
