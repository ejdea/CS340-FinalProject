/******************************************************************************
* Author:     Edmund Dea, Sam Judkis
* Date:       3/16/19
* Class:      CS340
* Title:      Final Project
* Filename:   scripts.js
******************************************************************************/

function popup() {
    var msg = document.getElementById("popup").textContent;

    if (msg != null && msg.length > 0) {
        JSAlert.alert(msg);
    }
}

window.onload = popup;