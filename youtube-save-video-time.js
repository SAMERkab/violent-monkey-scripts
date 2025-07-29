// ==UserScript==
// @name        Persist video playback time
// @namespace   Violentmonkey Scripts
// @match       https://www.youtube.com/*
// @grant GM.getValue
// @grant GM.setValue
// @grant GM.deleteValue
// @version     2.0
// @author      -
// @description 19/07/2025, 16:12:36
// ==/UserScript==

class Video {
  id;
  element;
  currentTimeInterval;

  static async fromThisPage() {
    const video = new Video();
    await video.findElementAndId();
    return video;
  }

  async findElementAndId() {
    return new Promise((resolve, reject) => {
      const searchForVideo = () => {
        this.setElementFromDocument();
        if (this.element) {
          this.setIdFromUrl();
          resolve(true);
        } else {
          setTimeout(searchForVideo, 250);
        }
      };
      searchForVideo();
    });
  }

  setElementFromDocument() {
    this.element = document.querySelector("#primary video");
  }

  setIdFromUrl() {
    this.id = new URL(window.location.href).searchParams.get("v");
  }

  startSavingCurrentTime() {
    this.currentTimeInterval = setInterval(() => {
      this.storeCurrentTime();
    }, 5000);
  }

  stopSavingCurrentTime() {
    clearInterval(this.currentTimeInterval);
  }

  async storeCurrentTime() {
    let currentTime = this.element?.currentTime;
    if (!Number.isFinite(currentTime)) return;

    if (currentTime >= 5) {
      await GM.setValue(this.id, Math.floor(currentTime));
    }
    if (currentTime >= this.element.duration - 5) {
      await GM.deleteValue(this.id);
    }
  }

  async seekStoredTime() {
    const savedTime = await GM.getValue(this.id);
    if (savedTime) {
      if (this.element.fastSeek) {
        this.element.fastSeek(savedTime);
      } else {
        this.element.currentTime = savedTime;
      }
    }
  }
}

let video = new Video();
console.log("script loaded: Persist video playback time");

const pageHasVideo = () => {
  return window.location.href.includes("watch");
};

const startVideoPlaybackTimePersistence = async () => {
  await video.findElementAndId();
  await video.seekStoredTime();
  video.startSavingCurrentTime();
};

window.addEventListener("load", (event) => {
  if (pageHasVideo()) {
    startVideoPlaybackTimePersistence();
  }
});

window.addEventListener("beforeunload", async (event) => {
  await video?.storeCurrentTime();
  video?.stopSavingCurrentTime();
});

window.addEventListener("popstate", (event) => {
  if (pageHasVideo()) {
    startVideoPlaybackTimePersistence();
  } else {
    video?.stopSavingCurrentTime();
  }
});
