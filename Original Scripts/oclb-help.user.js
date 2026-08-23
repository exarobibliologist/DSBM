// ==UserScript==
// @name        OCLB Helper
// @namespace   http://hampshirebrony.neocities.org
// @description     Augment's Kishan Bagaria's One Click Llama Button.
// @require	https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @icon            https://hampshirebrony.neocities.org/oclb-help.png
// @match           *://*.deviantart.com/*
// @match           *://kishanbagaria.com/userscripts/one-click-llama-button/exchangers/*
// @version     0.23
// @run-at          document-end
// @downloadURL     https://hampshirebrony.neocities.org/oclb-help.user.js
// @updateURL       https://hampshirebrony.neocities.org/oclb-help.user.js
// @exclude         *://www.deviantart.com/modal/badge/*
// ==/UserScript==

var hb_oclb_Active=0;
var hb_oclb_Panel=document.createElement("div");
var hb_oclb_Image=document.createElement("img");
var hb_oclb_Label=document.createElement("span");
var hb_oclb_Count=document.createElement("span");
var hb_oclb_StopAuto=0;

hb_oclb_Panel.setAttribute("style", "position:fixed;bottom:0;right:0;width:40px;height:40px; background-color: #797979; color: black; border: 2px solid black;z-index: 99999;cursor: default;");
hb_oclb_Panel.onclick = hb_oclb_TryBulkLlama;
hb_oclb_Panel.onmouseover = hb_oclb_GrowPanel;
hb_oclb_Panel.onmouseleave = hb_oclb_ShrinkPanel;
hb_oclb_Panel.id = "hb-oclb-icon";
document.body.appendChild(hb_oclb_Panel);

hb_oclb_Image.src = "http://hampshirebrony.neocities.org/oclb-help.png";
hb_oclb_Image.setAttribute("style", "height:32px; padding: 4px;");
hb_oclb_Panel.appendChild(hb_oclb_Image);

hb_oclb_Label.innerHTML = "";
hb_oclb_Label.setAttribute("style", "position: absolute; top: 0; right: 0px; display: none; font-family: Verdana, sans-serif; font-size: 14px; text-align: right;");
hb_oclb_Label.id = "hb-oclb-label";
hb_oclb_Panel.appendChild(hb_oclb_Label);

hb_oclb_Count.innerHTML = "";
hb_oclb_Count.setAttribute("style", "position: absolute; bottom: 0; left: 0px; right:0; font-family: Verdana, sans-serif; font-size: 16px; text-align: center; color: gold;");
hb_oclb_Count.id = "hb-oclb-count";
hb_oclb_Panel.appendChild(hb_oclb_Count);


console.log('loaded');
//hb_oclb_CheckLlama();
//setInterval(function() { hb_oclb_CheckLlama();}, 1000);
setTimeout(hb_oclb_CheckLlama, 1000);

window.addEventListener('message', function(e) {
    /*    alert('q');
    if (e.data !== 'oclb-loaded') return;
    alert('OCLB detected');*/
    console.log(e.data);
    console.log(e.data.includes('oclb'));
    if (!e.data.includes('oclb')) return;
    hb_oclb_CheckLlama();
});

function hb_oclb_TryBulkLlama() {
    if (hb_oclb_Active===0){
        hb_oclb_DoBulkLlama();
    }
}

function hb_oclb_DoBulkLlama() {
    //alert('oclb');
    if ($('.oclb-spam').length !== 0) {
        hb_oclb_StopAuto = 1;
    }
    if (($('.oclb-give').length !== 0) && ($('.oclb-spam').length === 0)) {
        hb_oclb_Active=1;
        //input.innerHTML="Add Llamas " + $('.oclb-give').length;
        setTimeout(function(){
            if (($('.oclb-give').length !== 0) && ($('.oclb-spam').length === 0)) {$('.oclb-give').first().click();}
            hb_oclb_DoBulkLlama();
        },500);
    } else {
        hb_oclb_Active=0;
        hb_oclb_CheckLlama();
    }
    if (($('.oclb-give').length === 0) && ($('.oclb-giving').length === 0)) {
        //document.getElementById("hb-oclb-icon").style.display="none";
    }
        hb_oclb_FindNextButton();

}

function hb_oclb_CheckLlama() {
    var hb_oclb_give    = $('.oclb-give').length;
    var hb_oclb_giving  = $('.oclb-giving').length;
    var hb_oclb_success = $('.oclb-success').length;
    var hb_oclb_error   = $('.oclb-error').length;
    var hb_oclb_spam    = $('.oclb-spam').length;
    var hb_oclb_unknown = $('.oclb-unknown').length;
    var hb_oclb_enough  = $('.oclb-enough').length;
    var hb_oclb_100k    = $('.oclb-100k').length;
    var hb_oclb_total = hb_oclb_give +  hb_oclb_giving +  hb_oclb_success +  hb_oclb_error +  hb_oclb_spam +  hb_oclb_unknown +  hb_oclb_enough +  hb_oclb_100k;
    /*var s = "Number of Give Llama buttons: " + llamas + "<br />";
    s += "Number of giving icons: " + $('.oclb-giving').length + "<br />";
    s += "Number of success icons: " + $('.oclb-success').length + "<br />";
    s += "Number of error icons: " + $('.oclb-error').length + "<br />";
    s += "Number of unknown icons: " + $('.oclb-unknown').length + "<br />";
    s += "Number of enough icons: " + $('.oclb-enough').length + "<br />";
    s += "Number of 100k icons: " + $('.oclb-100k').length + "<br />";
    s += "Number of spam icons: " + $('.oclb-spam').length;*/
    var s = "<u>Llamas on current page</u><table>";
    s += "<tr><td style=\"font-weight: bold;\">Add buttons</td><td style=\"font-weight: bold;\">" + hb_oclb_give + "</td><td style=\"font-weight: bold;\">Given</td><td style=\"font-weight: bold;\">" + hb_oclb_success + "</td></tr>";
    s += "<tr><td>Giving</td><td>" + hb_oclb_giving + "</td><td>Spam</td><td>" + hb_oclb_spam + "</td></tr>";
    s += "<tr><td>Unknown</td><td>" + $('.oclb-unknown').length + "</td><td>Errors</td><td>" + hb_oclb_error + "</td></tr>";
    s += "<tr><td>Enough for love</td><td>" + (hb_oclb_enough + hb_oclb_100k) + "</td><td>Total</td><td>" + hb_oclb_total + "</td></tr>";
    s += "</table>";
    document.getElementById("hb-oclb-label").innerHTML=s;
    document.getElementById("hb-oclb-count").innerHTML=hb_oclb_give;
    //document.getElementById("hb-oclb-count").innerHTML='...';

    if (hb_oclb_Active === 0) {
        document.getElementById("hb-oclb-icon").style.borderColor="black";
        if (hb_oclb_StopAuto === 0 && hb_oclb_unknown === 0 && window.location.search.substring(1).includes("hb_oclbh")) {
            //hb_oclb_FindNextButton();
            setTimeout(hb_oclb_DoBulkLlama,1000);
        }
    } else {
        document.getElementById("hb-oclb-icon").style.borderColor="gold";
    }
    if (hb_oclb_StopAuto===1) {
        document.getElementById("hb-oclb-icon").style.borderColor="red";
    }
}

function hb_oclb_GrowPanel() {
    //hb_oclb_CheckLlama();
    document.getElementById("hb-oclb-icon").style.width="275px";
    document.getElementById("hb-oclb-icon").style.height="110px";
    document.getElementById("hb-oclb-label").style.display="block";
    document.getElementById("hb-oclb-count").style.display="none";

}
function hb_oclb_ShrinkPanel() {
    document.getElementById("hb-oclb-icon").style.width="40px";
    document.getElementById("hb-oclb-icon").style.height="40px";
    document.getElementById("hb-oclb-label").style.display="none";
    document.getElementById("hb-oclb-count").style.display="block";
}
function hb_oclb_FindNextButton() {
    if (hb_oclb_StopAuto === 1) { return;}
    if (window.location.href.includes('modals/memberlist')){
        var p = document.getElementsByClassName("pagination")[0]
        var s = p.innerHTML
        if (($('.oclb-give').length === 0) && ($('.oclb-giving').length === 0) && ($('.oclb-spam').length === 0)) {
            //p.innerHTML = "Can move on";
            var s1 = s.match(/\<li class=\"next.*Next/i).toString()
            var s2 = s1.replace(/^.*href=\"/,'').toString()
            var s3 = s2.replace(/\".*/,'').toString()

            window.location = s3 + '&hb_oclbh';
            //hb_oclb_DoBulkLlama();
        } else {
            //document.getElementById("hb-oclb-label").innerHTML="No can do";
        }
    }
}