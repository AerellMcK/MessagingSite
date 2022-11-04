var error;
try { JSON.parse(localStorage.getItem('settings')); } catch (e) { error = true; }
if (!localStorage.getItem('settings') || error) {
    localStorage.setItem("settings", JSON.stringify({
        name: prompt("Username?"),
        nameColor: "#ffffff",
        iconColor: "#404040"
    }));
}
delete error;

var Settings = JSON.parse(localStorage.getItem("settings"));
// document.querySelector('#iconColor').value = Settings.iconColor;
// document.querySelector('#nameColor').value = Settings.nameColor;
for (let setting of Array.from(document.querySelectorAll(".setting"))) {
    setting.value = Settings[setting.id];
    setting.addEventListener('change', () => {
        setSetting(setting.id, setting.value);
        setting.value = Settings[setting.id];
    })
}

const firebaseConfig = {
    apiKey: "AIzaSyAeNhzM5tgd1tvjS8l-wHuHTahHBRS_QeI",
    authDomain: "school-messaging-ad404.firebaseapp.com",
    projectId: "school-messaging-ad404",
    storageBucket: "school-messaging-ad404.appspot.com",
    messagingSenderId: "6663267259",
    appId: "1:6663267259:web:59dc396f07563a9c43da9e",
    measurementId: "G-73VCT4T2V1"
};
firebase.initializeApp(firebaseConfig);
var myName = Settings.name;
var messagesRef = firebase.database().ref("messages").limitToLast(100).orderByChild('timestamp');
var messagesRefUnlimited = firebase.database().ref("messages");
var images = [];
function sendMessage() {
    try {
        var message = document.querySelector('#message');
        if (!message.value.length && !images.length) return false;
        messagesRefUnlimited.push().set({
            sender: myName,
            message: message.value,
            timestamp: Date.now(),
            nameColor: Settings.nameColor,
            iconColor: Settings.iconColor,
            attachments: images
        });
        message.value = "";
        images = [];
        [...document.querySelector('.imagesDiv').children].forEach(x => x.remove());
        return false;
    } catch (e) {
        alert(e)
        images = [];
    }
};
function deleteMessage(self) {
    var messageId = self.getAttribute("data-id");
    if (confirm("Are you sure you want to delete this message?")) messagesRefUnlimited.child(messageId).remove();
    return false;
};


messagesRef.on("child_added", (s) => {
    var message = parseMessage(s.val().message);
    var { attachments } = s.val();
    var prevMessage = Array.from(document.querySelector('#messages').children).filter(x => x.querySelector('.message-author'))[0];
    var addProfile = Array.from(document.querySelector('#messages').children).filter(x => x.querySelector('.message-author'))[0]?.querySelector('.message-author').innerHTML != s.val().sender
        || (prevMessage && Math.abs(parseInt(prevMessage.querySelector("span[class*='timestamp']").getAttribute('data-timestamp')) - s.val().timestamp) > 1000 * 60 * 20)
        || (Array.from(document.querySelector('#messages').children)[0]
            && Math.abs(parseInt(prevMessage.querySelector("span[class*='timestamp']").getAttribute('data-timestamp')) - s.val().timestamp) > 1000 * 60 * 5);
    // const newMessage = document.createElement("li");
    // newMessage.id = `message-${s.key}`;
    // const messageContent = document.createElement("div");
    // newMessage.appendChild(messageContent);
    // if (addProfile) {
    //     const messageProfile = document.createElement("div");
    //     newMessage.appendChild(messageProfile);
    //     messageProfile.classList.add("message-profile");
    //     const svg = document.createElement("svg");
    //     messageProfile.appendChild(svg);
    //     svg.setAttribute("xmlns", "https://www.w3.org/2000/svg");
    //     svg.setAttribute("fill", s.val().iconColor || "#404040");
    //     svg.setAttribute("viewBox", "0 0 8 8");
    //     svg.innerHTML = `<circle cx="4" cy="4" r="4" />`;
    //     const name = document.createElement("h2");
    //     messageProfile.appendChild(name);
    //     const messageAuthor = document.createElement("span");
    //     name.appendChild(messageAuthor);
    //     messageAuthor.classList.add("message-author");
    //     messageAuthor.style.color = s.val().iconColor || "white";
    //     messageAuthor.innerHTML = s.val().sender;
    //     const timestamp = document.createElement("span");
    //     name.appendChild(timestamp);
    //     timestamp.dataset.timestamp = s.val().timestamp;
    //     timestamp.classList.add("timestamp");
    //     timestamp.innerHTML = parseDate(s.val().timestamp || 0);
    // }
    var html = (`<li id='message-${s.key}'>
    <div>${addProfile ? `
        <div class="message-profile">
            <svg xmlns="http://www.w3.org/2000/svg" fill="${s.val().iconColor || "#404040"}" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="4"/>
            </svg>
            <h2>
                <span class="message-author" style="color: ${s.val().nameColor || "#ffffff"}">${s.val().sender}</span>
                <span data-timestamp="${s.val().timestamp}" class="timestamp">${parseDate(s.val().timestamp || 0)}</span>
            </h2>
        </div>` : ''}
        ${addProfile ? `<div class="message-content profile">${message}${attachments?.length ? `<div class="imageDiv">${attachments.map(url => {
            return `<img class="attachment" src="${url}" />`
        }).join('<br>')}</div>` : ''}</div>` : `
        <h2 class="side">
        <span data-timestamp="${s.val().timestamp}" class="timestamp-side">${parseDate(s.val().timestamp || 0, true)}</span>
            </h2>
            <div class="message-content">${message}${attachments?.length ? `<div class="imageDiv">${attachments.map(url => {
                return `<img class="attachment" src="${url}" />`
            }).join('<br>')}</div>` : ''}</div>`
        }
        </div>${s.val().sender == myName ? `
        <div class="message-options">
        <button style="color: red" id="delete" data-id='${s.key}' onclick='deleteMessage(this);'>Delete</button>
        </div>` : ''}
</li>`)
    if (prevMessage && prevMessage.querySelector("span[class*='timestamp']").getAttribute('data-timestamp') > s.val().timestamp) document.querySelector('#messages').innerHTML = document.querySelector('#messages').innerHTML + html;
    else document.querySelector('#messages').innerHTML = html + document.querySelector('#messages').innerHTML;
});
messagesRef.on("child_removed", (s) => {
    document.querySelector(`#message-${s.key}`).remove();
});
messagesRef.on("child_changed", s => {
    document.querySelector(`#message-${s.key} > * > .message-content`).innerHTML = parseMessage(s.val().message);
});

addEventListener('keypress', () => document.querySelector('#message').focus());

function parseMessage(message) {
    return HtmlEncode(message)
        .split(/ /g).map((string, i) => isValidUrl(string) ? (isImage(string) ? `${i == 0 ? '' : '<br>'}<img src="${string}"></img>` : `<a target="_blank" rel="noopener noreferrer" href="${string}">${string}</a>`) : string).join(' ')
        .replace(/\*\*(.*?)\*\*/g, str => `<strong>${str.match(/\*\*(.*?)\*\*/i)[1]}</strong>`)
        .replace(/\*(.*[\s]?)\*/g, str => `<em>${str.match(/\*(.*[\s]?)\*/i)[1]}</em>`);
}

function parseDate(time, side = false) {
    let date = new Date(time);
    var fullDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
    var hour = date.getHours();
    var minutes = date.getMinutes();
    var pm = hour >= 12 && hour != 24;
    hour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    minutes = minutes.toString().length == 1 ? `0${minutes}` : minutes;
    return `${side ? '' : fullDate} ${hour}:${minutes} ${pm ? "PM" : "AM"}`
}

function openSettings() {
    console.log(Settings);
}

function setSetting(key, value) {
    Settings[key] = value;
    localStorage.setItem("settings", JSON.stringify(Settings));
}

function deleteSetting(key) {
    delete Settings[key];
    localStorage.setItem("settings", JSON.stringify(Settings));
}

function updateSettings(self) {
    console.log(self);
    setSetting('iconColor', self.querySelector('#iconColor').value);
    setSetting('nameColor', self.querySelector('#nameColor').value);
    return false;
}

function HtmlEncode(s) {
    var el = document.createElement("div");
    el.innerText = el.textContent = s;
    s = el.innerHTML;
    return s;
}
function isValidUrl(urlString) {
    let url;
    try { url = new URL(urlString); }
    catch (e) { return false; }
    return url.protocol === "http:" || url.protocol === "https:";
}
function isImage(url, checkLink = true) {
    return (checkLink ? isValidUrl(url) : true) && /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url);
}
