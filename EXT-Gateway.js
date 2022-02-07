/**
 ** Module : EXT-Gateway
 ** @bugsounet ©02-2022
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

  start: async function () {
    if (this.config.debug) logGW = (...args) => { console.log("[GATEWAY]", ...args) }
    this.ExtDB = [
      "EXT-Spotify",
      "EXT-NewPIR",
      "EXT-YouTube",
      "EXT-YouTubeVLC",
      "EXT-Links",
      "EXT-GooglePhotos",
      "EXT-RadioPlayer",
      "EXT-MusicPlayer",
      "EXT-Alert",
      "EXT-Volume"
    ]

    this.GW = {
      ready: false
    }

    await Promise.all(this.ExtDB.map(Ext=> {
      this.GW[Ext] = {
        hello: false,
        connected: false
      }
    }))

    /* special rule for EXT-NEWPIR */
    this.GW["EXT-NewPIR"].power = true
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
      case "USER_PRESENCE":
        if (!this.GW["EXT-NewPIR"].hello) return
        this.GW["EXT-NewPIR"].power = payload ? true : false
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
        if(this.GW["EXT-NewPIR"].hello && !this.hasOwnDeepValueProperty(this.GW, "connected", true)) {
          if (!this.GW["EXT-NewPIR"].power) this.sendNotification("EXT_SCREEN-WAKEUP")
          this.sendNotification("EXT_SCREEN-LOCK")
        }
        if (this.GW["EXT-Spotify"].hello && this.GW["EXT-Spotify"].connected) this.sendNotification("EXT_SPOTIFY-VOLUME_MIN")
        if (this.GW["EXT-RadioPlayer"].hello && this.GW["EXT-RadioPlayer"].connected) this.sendNotification("EXT_RADIO-VOLUME_MIN")
        if (this.GW["EXT-MusicPlayer"].hello && this.GW["EXT-MusicPlayer"].connected) this.sendNotification("EXT_MUSIC-VOLUME_MIN")
        if (this.GW["EXT-YouTubeVLC"].hello && this.GW["EXT-YouTubeVLC"].connected) this.sendNotification("EXT_YOUTUBEVLC-VOLUME_MIN")
        break
      case "ASSISTANT_STANDBY":
        if(this.GW["EXT-NewPIR"].hello && !this.hasOwnDeepValueProperty(this.GW, "connected", true)) {
          this.sendNotification("EXT_SCREEN-UNLOCK") // unlock the screen
        }
        if (this.GW["EXT-Spotify"].hello && this.GW["EXT-Spotify"].connected) this.sendNotification("EXT_SPOTIFY-VOLUME_MAX")
        if (this.GW["EXT-RadioPlayer"].hello && this.GW["EXT-RadioPlayer"].connected) this.sendNotification("EXT_RADIO-VOLUME_MAX")
        if (this.GW["EXT-MusicPlayer"].hello && this.GW["EXT-MusicPlayer"].connected) this.sendNotification("EXT_MUSIC-VOLUME_MAX")
        if (this.GW["EXT-YouTubeVLC"].hello && this.GW["EXT-YouTubeVLC"].connected) this.sendNotification("EXT_YOUTUBEVLC-VOLUME_MAX")
        break
      case "ASSISTANT_REPLY":
      case "ASSISTANT_CONTINUE":
      case "ASSISTANT_CONFIRMATION":
      case "ASSISTANT_ERROR":
      case "ASSISTANT_HOOK":
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
        if (!this.GW["EXT-NewPIR"].hello) return console.log("[GATEWAY] Warn NewPIR don't say to me HELLO!")
        this.GW["EXT-NewPIR"].power = false
        break
      case "EXT_SCREEN-ON":
        if (!this.GW["EXT-NewPIR"].hello) return console.log("[GATEWAY] Warn NewPIR don't say to me HELLO!")
        this.GW["EXT-NewPIR"].power = true
        break
      case "EXT_STOP":
        if (this.GW.alert.hello) this.sendNotification("EXT_ALERT", { type: "information", message: "Tous les processus Extented sont maintenant arrêtés" })
        break
      case "EXT_MUSIC-CONNECTED":
        if (!this.GW["EXT-MusicPlayer"].hello) return console.log("[GATEWAY] Warn MusicPlayer don't say to me HELLO!")
        this.connected("EXT-MusicPlayer")
        break
      case "EXT_MUSIC-DISCONNECTED":
        if (!this.GW["EXT-MusicPlayer"].hello) return console.log("[GATEWAY] Warn MusicPlayer don't say to me HELLO!")
        this.disconnected("EXT-MusicPlayer")
        break
      case "EXT_RADIO-CONNECTED":
        if (!this.GW["EXT-RadioPlayer"].hello) return console.log("[GATEWAY] Warn RadioPlayer don't say to me HELLO!")
        this.connected("EXT-RadioPlayer")
        break
      case "EXT_RADIO-DISCONNECTED":
        if (!this.GW["EXT-RadioPlayer"].hello) return console.log("[GATEWAY] Warn RadioPlayer don't say to me HELLO!")
        this.disconnected("EXT-RadioPlayer")
        break
      case "EXT_SPOTIFY-CONNECTED":
      case "EXT_SPOTIFY-DISCONNECTED":
        /* do nothing */
        break
      case "EXT_SPOTIFY-PLAYER_CONNECTED":
        if (!this.GW["EXT-Spotify"].hello) return console.error("[GATEWAY] Warn Spotify don't say to me HELLO!")
        this.connected("EXT-Spotify")
        break
      case "EXT_SPOTIFY-PLAYER_DISCONNECTED":
        if (!this.GW["EXT-Spotify"].hello) return console.error("[GATEWAY] Warn Spotify don't say to me HELLO!")
        this.disconnected("EXT-Spotify")
        break
      case "EXT_YOUTUBE-CONNECTED":
        if (!this.GW["EXT-YouTube"].hello) return console.error("[GATEWAY] Warn YouTube don't say to me HELLO!")
        this.connected("EXT-YouTube")
        break
      case "EXT_YOUTUBE-DISCONNECTED":
        if (!this.GW["EXT-YouTube"].hello) return console.error("[GATEWAY] Warn YouTube don't say to me HELLO!")
        this.disconnected("EXT-YouTube")
        break
      case "EXT_YOUTUBEVLC-CONNECTED":
        if (!this.GW["EXT-YouTubeVLC"].hello) return console.error("[GATEWAY] Warn YouTubeVLC don't say to me HELLO!")
        this.connected("EXT-YouTubeVLC")
        break
      case "EXT_YOUTUBEVLC-DISCONNECTED":
        if (!this.GW["EXT-YouTubeVLC"].hello) return console.error("[GATEWAY] Warn YouTubeVLC don't say to me HELLO!")
        this.disconnected("EXT-YouTubeVLC")
        break

      /** IgnoreLand case! **/
      case "EXT_ALERT":
      case "EXT_VOLUME_SET":
      case "EXT_YOUTUBEVLC-SEARCH":
      case "EXT_YOUTUBE-SEARCH":
        break

      /** Warn if not in db **/
      default:
        console.error("[GATEWAY] Sorry, i don't understand what is", noti, payload)
        break
    }
  },

  /** Activate automaticaly any plugins **/
  helloEXT: function(module) {
    switch (module) {
      case this.ExtDB.find(name => name === module): //read DB and find module
        this.GW[module].hello= true
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
    if(this.GW["EXT-NewPIR"].hello && !this.hasOwnDeepValueProperty(this.GW, "connected", true)) {
      if (!this.GW["EXT-NewPIR"].power) this.sendNotification("EXT_SCREEN-WAKEUP")
      this.sendNotification("EXT_SCREEN-LOCK")
    }
    if (this.GW["EXT-Spotify"].hello && this.GW["EXT-Spotify"].connected) this.sendNotification("EXT_SPOTIFY-STOP")
    if (this.GW["EXT-MusicPlayer"].hello && this.GW["EXT-MusicPlayer"].connected) this.sendNotification("EXT_MUSIC-STOP")
    if (this.GW["EXT-RadioPlayer"].hello && this.GW["EXT-RadioPlayer"].connected) this.sendNotification("EXT_RADIO-STOP")
    if (this.GW["EXT-YouTube"].hello && this.GW["EXT-YouTube"].connected) this.sendNotification("EXT_YOUTUBE-STOP")
    if (this.GW["EXT-YouTubeVLC"].hello && this.GW["EXT-YouTubeVLC"].connected) this.sendNotification("EXT_YOUTUBEVLC-STOP")
    logGW("Connected:", extName)
    this.GW[extName].connected = true
  },

  /** disconnected rules **/
  disconnected: function(extName) {
    if (!this.GW.ready) return console.error("[GATEWAY] MMM-GoogleAssistant is not ready")
    if (extName) this.GW[extName].connected = false
    // sport time ... verify if there is again an EXT module connected !
    setTimeout(()=> { // wait 1 sec before scan ...
      if(this.GW["EXT-NewPIR"].hello && !this.hasOwnDeepValueProperty(this.GW, "connected", true)) this.sendNotification("EXT_SCREEN-UNLOCK")
      logGW("Disconnected:", extName)
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
