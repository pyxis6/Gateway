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
    this.GW = {
      ready: false,
      spotify: {
        hello: false,
        connected: false
      },
      screen: {
        hello: false,
        connected: false,
        power: true
      },
      youtube: {
        hello: false,
        connected: false
      },
      links: {
        hello: false,
        connected: false
      },
      photos: {
        hello: false,
        connected: false
      },
      radio: {
        hello: false,
        connected: false
      },
      music: {
        hello: false,
        connected: false
      },
      alert: {
        hello: false,
        connected: false
      },
      volume: {
        hello: false
      },
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

  notificationReceived: function(noti, payload, sender) {
    if (noti.startsWith("ASSISTANT_")) return this.ActionsOnStatus(noti)
    if (noti.startsWith("EXT_")) return this.ActionsOnExt(noti,payload)
    switch(noti) {
      case "DOM_OBJECTS_CREATED":
        this.sendSocketNotification("INIT", this.config)
        break
      case "GA_READY":
        this.GW.ready = true
        logGW("EXT-Gateway is ready!")
        break
      case "SHOW_ALERT": // trigger Alert to EXT-Alert module
        if (!this.GW.alert.hello) return
        logGW("Trigger Alert from:", payload)
        this.sendNotification("EXT_ALERT", {
          message: payload.message,
          type: "warning",
          sender: payload.title ? payload.title : sender.name,
          timer: (payload.timer && payload.timer !=0)  ? payload.timer : null
        })
        break
    }
  },

  /***********************/
  /** GA Status Gateway **/
  /***********************/

  ActionsOnStatus: function(status) {
    if (!this.GW.ready) return console.log("[GATEWAY] MMM-GoogleAssistant is not ready")
    logGW("Received GA status:", status)
    switch(status) {
      case "ASSISTANT_LISTEN":
      case "ASSISTANT_THINK":
        if(this.GW.screen.hello && !this.hasOwnDeepValueProperty(this.GW, "connected", true)) {
          if (!this.GW.screen.power) this.sendNotification("EXT_SCREEN-WAKEUP")
          this.sendNotification("EXT_SCREEN-LOCK")
        }
        if (this.GW.spotify.hello && this.GW.spotify.connected) this.sendNotification("EXT_SPOTIFY-VOLUME_MIN")
        if (this.GW.radio.hello && this.GW.radio.connected) this.sendNotification("EXT_RADIO-VOLUME_MIN")
        if (this.GW.music.hello && this.GW.music.connected) this.sendNotification("EXT_MUSIC-VOLUME_MIN")
        /** to code...
        this.sendNotification("EXT_YT-CVLC_VOLUME_MIN")
        
        **/
        break
      case "ASSISTANT_STANDBY":
        if(this.GW.screen.hello && !this.hasOwnDeepValueProperty(this.GW, "connected", true)) {
          this.sendNotification("EXT_SCREEN-UNLOCK") // unlock the screen
        }
        if (this.GW.spotify.hello && this.GW.spotify.connected) this.sendNotification("EXT_SPOTIFY-VOLUME_MAX")
        if (this.GW.radio.hello && this.GW.radio.connected) this.sendNotification("EXT_RADIO-VOLUME_MAX")
        if (this.GW.music.hello && this.GW.music.connected) this.sendNotification("EXT_MUSIC-VOLUME_MAX")
        /** to code ...
        this.sendNotification("EXT_YT-CVLC_VOLUME_MAX")
        **/
        break
      case "ASSISTANT_REPLY":
      case "ASSISTANT_CONTINUE":
      case "ASSISTANT_CONFIRMATION":
      case "ASSISTANT_ERROR":
      case "ASSISTANT_HOOK":
        break
      case "USER_PRESENCE":
        if (!this.GW.screen.hello) return
        this.GW.screen.power = payload ? true : false
        break
    }
  },

  /*****************/
  /** Ext Gateway **/
  /*****************/

  ActionsOnExt: function(noti,payload) {
    switch(noti) {
      case "EXT_HELLO":
        this.helloEXT(payload)
        break
      case "EXT_SCREEN-OFF":
        if (!this.GW.screen.hello) return console.log("[GATEWAY] Warn NewPIR don't say to me HELLO!")
        this.GW.screen.power = false
        break
      case "EXT_SCREEN-ON":
        if (!this.GW.screen.hello) return console.log("[GATEWAY] Warn NewPIR don't say to me HELLO!")
        this.GW.screen.power = true
        break
      case "EXT_STOP":
        if (this.GW.alert.hello) this.sendNotification("EXT_ALERT", { type: "information", message: "Tous les processus Extented sont maintenant arrêtés" })
        break
      case "EXT_MUSIC-CONNECTED":
        if (!this.GW.music.hello) return console.log("[GATEWAY] Warn MusicPlayer don't say to me HELLO!")
        this.connected("music")
        break
      case "EXT_MUSIC-DISCONNECTED":
        if (!this.GW.music.hello) return console.log("[GATEWAY] Warn MusicPlayer don't say to me HELLO!")
        this.disconnected("music")
        break
      case "EXT_RADIO-CONNECTED":
        if (!this.GW.radio.hello) return console.log("[GATEWAY] Warn RadioPlayer don't say to me HELLO!")
        this.connected("radio")
        break
      case "EXT_RADIO-DISCONNECTED":
        if (!this.GW.radio.hello) return console.log("[GATEWAY] Warn RadioPlayer don't say to me HELLO!")
        this.disconnected("radio")
        break
      case "EXT_SPOTIFY-CONNECTED":
      case "EXT_SPOTIFY-DISCONNECTED":
        /* do nothing */
        break
      case "EXT_SPOTIFY-PLAYER_CONNECTED":
        if (!this.GW.spotify.hello) return console.error("[GATEWAY] Warn Spotify don't say to me HELLO!")
        this.connected("spotify")
        break
      case "EXT_SPOTIFY-PLAYER_DISCONNECTED":
        if (!this.GW.spotify.hello) return console.error("[GATEWAY] Warn Spotify don't say to me HELLO!")
        this.disconnected("spotify")
        break
      case "EXT_YOUTUBE-CONNECTED":
        if (!this.GW.youtube.hello) return console.error("[GATEWAY] Warn YouTube don't say to me HELLO!")
        this.connected("youtube")
        break
      case "EXT_YOUTUBE-DISCONNECTED":
        if (!this.GW.youtube.hello) return console.error("[GATEWAY] Warn YouTube don't say to me HELLO!")
        this.disconnected("youtube")
        break
      case "EXT_ALERT":
      case "EXT_VOLUME_SET":
        break
      default:
        console.error("[GATEWAY] Sorry, i don't understand what is", noti, payload)
        break
    }
  },

  /** Activate automaticaly any plugins **/
  helloEXT: function(module) {
    switch (module) {
      case "EXT-Spotify":
        this.GW.spotify.hello= true
        logGW("Hello,", module)
        break
      case "EXT-NewPIR":
        this.GW.screen.hello= true
        logGW("Hello,", module)
        break
      case "EXT-Links":
        this.GW.links.hello= true
        logGW("Hello,", module)
        break
      case "EXT-GooglePhotos":
        this.GW.photos.hello= true
        logGW("Hello,", module)
        break
      case "EXT-RadioPlayer":
        this.GW.radio.hello= true
        logGW("Hello,", module)
        break
      case "EXT-MusicPlayer":
        this.GW.music.hello= true
        logGW("Hello,", module)
        break
      case "EXT-YouTube":
        this.GW.youtube.hello= true
        logGW("Hello,", module)
        break
      case "EXT-Alert":
        this.GW.alert.hello= true
        logGW("Hello,", module)
        break
      case "EXT-Volume":
        this.GW.volume.hello= true
        logGW("Hello,", module)
        break
      default:
        console.error("[GATEWAY] Hi,", module, "what can i do for you ?")
        break
    }
  },

  /** connected rules **/
  connected: function(extName) {
    if (!this.GW.ready) return console.error("[GATEWAY] Hey!,", extName, "MMM-GoogleAssistant is not ready")
    if(this.GW.screen.hello && !this.hasOwnDeepValueProperty(this.GW, "connected", true)) {
      if (!this.GW.screen.power) this.sendNotification("EXT_SCREEN-WAKEUP")
      this.sendNotification("EXT_SCREEN-LOCK")
    }
    if (this.GW.spotify.hello && this.GW.spotify.connected) this.sendNotification("EXT_SPOTIFY-STOP")
    if (this.GW.music.hello && this.GW.music.connected) this.sendNotification("EXT_MUSIC-STOP")
    if (this.GW.radio.hello && this.GW.radio.connected) this.sendNotification("EXT_RADIO-STOP")
    if (this.GW.youtube.hello && this.GW.youtube.connected) this.sendNotification("EXT_YOUTUBE-STOP")
    this.GW[extName].connected = true
    logGW("Connected:", extName)
  },

  /** disconnected rules **/
  disconnected: function(extName) {
    if (!this.GW.ready) return console.error("[GATEWAY] MMM-GoogleAssistant is not ready")
    if (extName) this.GW[extName].connected = false
    // sport time ... verify if there is again an EXT module connected !
    setTimeout(()=> { // wait 1 sec before scan ...
      if(!this.hasOwnDeepValueProperty(this.GW, "connected", true)) this.sendNotification("EXT_SCREEN-UNLOCK")
      logGW("Disconnected", extName)
    }, 1000)
  },

  /***************/
  /**** Tools ****/
  /***************/

  /** hasOwnDeepValueProperty(obj, key, value)
   * obj: object to check
   * key: key to check in deep
   * value: value to check with associated key
   * @bugsounet 09/01/2022
  **/
  hasOwnDeepValueProperty: function(obj, key, value) {
    if (typeof obj === 'object' && obj !== null) {
      if (obj.hasOwnProperty(key)) return true
      for (var p in obj) {
        if (obj.hasOwnProperty(p) && this.hasOwnDeepValueProperty(obj[p], key, value)) {
          //logGW("check", key+":"+value, "in", p)
          if (obj[p][key] == value) {
            logGW(p, "is connected")
            return true
          }
        }
      }
    }
    return false
  }
})
