// ==UserScript==
// @name        Update the url to include the current playback time
// @namespace   Violentmonkey Scripts
// @match       https://www.youtube.com/*
// @grant GM.getValue
// @grant GM.setValue
// @grant GM.deleteValue
// @version     1.0
// @author      -
// @description 19/07/2025, 16:12:36
// ==/UserScript==

/*
  window.history.replaceState({}, "", urlWithTime);
  window.location.replace(urlWithTime);
*/

class Video {
  id;
  element;
  currentTime;
  currentTimeInterval;

  static async fromThisPage() {
    const video = new Video();

    return new Promise(function(resolve, reject) {
      function searchForVideo() {
        video.updateElement();
        if (video.element) {
          video.updateId();
          resolve(video);
        } else {
          setTimeout(searchForVideo, 250);
        }
      }
      searchForVideo();
    });
  }

  constructor() {
    startSavingCurrentTime();
  }

  updateElement() {
    this.element = document.querySelector("#primary video");
  }

  updateId() {
    this.id = (new URL(window.location.href)).searchParams.get("v");;
  }

  startSavingCurrentTime() {
    this.currentTimeInterval = setInterval(() => {
      this.currentTime = this.element?.currentTime;
    }, 5000);
  }

  stopSavingCurrentTime() {
    clearInterval(this.currentTimeInterval);
  }

  async storeCurrentTime() {
    if (this.currentTime >= 5) {
      await GM.setValue(this.id, Math.floor(this.currentTime ?? 0));
    }
    if (this.currentTime >= this.element.duration - 5) {
      await GM.deleteValue(this.id);
    }
  }

  async seekStoredTime() {
    const savedTime = await GM.getValue(this.id);
    if (savedTime) {
      this.element.fastSeek(savedTime);
    }
  }
}

function pageHasVideo() {
  return window.location.href.includes("watch");
}

let video = null;

window.addEventListener("load", async (event) => {
  if (pageHasVideo()) {
    video = await Video.fromThisPage();
    await video.seekStoredTime();
  }
});

window.addEventListener("popstate", async (event) => {
  if (pageHasVideo()) {
    video = await Video.fromThisPage();
    await video.seekStoredTime();
  } else {
    await video?.storeCurrentTime();
    video?.stopSavingCurrentTime();
  }
});

window.addEventListener("beforeunload", async (event) => {
  await video?.storeCurrentTime();
  video?.stopSavingCurrentTime();
});



/*
function createUrlWithPlaybackTime(playbackTime) {
  const parsedUrl = new URL(window.location.href);
  parsedUrl.searchParams.set("t", playbackTime);
  return parsedUrl.href;
}
*/












