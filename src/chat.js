var socket = io.connect('http://' + document.domain + ':' + location.port); // change by https:// if your use https proxy like replit
var uid = "{{ username }}";//document.cookie;//Math.floor(Math.random() * 1000000000);
var iid = 0;
var roomID = $('#user-id-input').val();
var menuVisible = false;
var addButton = $('#add-button');
var inputContainer = $('#input-container');

function sendnew(roomid) {
    roomID = roomid;
    socket.emit('message', {
        data: JSON.stringify({
            message: 'Connected!',
            usid: uid,
            roomID: roomid,
            cookies: document.cookie
        })
    });
    $('#mmsg2').empty();
    $('#user-id-input').val(roomid);
    document.getElementById("message-input").placeholder = "Message a envoyer dans " + roomid + "...";
    menuVisible = !menuVisible;
    var leftValue = menuVisible ? '0' : '-150px';
    $('#menu').css('left', leftValue);
    if (!menuVisible) {
        addButton.css('display', 'none');
        $('#toggle-menu-button').css('width', '30px');
    } else {
        addButton.css('display', 'inline');
        $('#toggle-menu-button').css('width', '180px');
    }
}
$(document).ready(function() {

    addButton.css('display', 'none');
    $('#menu-button').on('click', function() {
        menuVisible = !menuVisible;
        var leftValue = menuVisible ? '0' : '-150px';
        $('#menu').css('left', leftValue);
    });

    addButton.on('click', function() {
        inputContainer.show();
    });

    $('#ok-button').on('click', function() {
        var itemName = $('#item-name').val();
        var itemId = $('#item-id').val();
        if (itemName && itemId) {
            var newItem = $('<div class="menu-item" onclick="sendnew(\'' + itemId + '\');">' + itemName + ' (' + itemId + ')</div>');
            $('#menu').append(newItem);
            inputContainer.hide();
            $('#item-name').val('');
            $('#item-id').val('');
        }
    });

    $('#toggle-menu-button').on('click', function() {
        menuVisible = !menuVisible;
        var leftValue = menuVisible ? '0' : '-150px';
        $('#menu').css('left', leftValue);
        if (!menuVisible) {
            addButton.css('display', 'none');
            $('#toggle-menu-button').css('width', '30px');
        } else {
            addButton.css('display', 'inline');
            $('#toggle-menu-button').css('width', '180px');
        }
    });
});

function formatMessage(message, usid) {
    message = "<" + usid + ">: \n" + message;
    const words = message.split(" ");
    const container = document.createElement("div");
    for (const word of words) {
        const wordNode = document.createTextNode(word + " ");

        if (word.startsWith("@")) {
            const username = word.substring(1);
            const strongNode = document.createElement("strong");
            strongNode.textContent = "@" + username + " ";
            container.appendChild(strongNode);
        } else if (word.match(/^https?:\/\/[^\s/$.?#].[^\s]*$/i)) {
            const urlNode = document.createElement("a");
            urlNode.href = word;
            urlNode.textContent = word + " ";
            urlNode.target = "_blank";
            container.appendChild(urlNode);
        } else {
            container.appendChild(wordNode);
        }
    }

    return container;
}
document.addEventListener("keydown", KeyCheck);

function KeyCheck(event) {
    var KeyID = event.keyCode;
    switch (KeyID) {
        case 13:
            var message = $('#message-input').val();
            if (message !== '' && message.startsWith("/change-chat-room") === false) {
                socket.emit('message', {
                    data: JSON.stringify({
                        message: message,
                        usid: uid,
                        roomID: roomID,
                        cookies: document.cookie
                    })
                });
                $('#message-input').val('');
                window.scrollTo(0, document.body.scrollHeight);
                $('#mmsg2').append($('<div class="message-box sent">').text('Moi : \n' + message));
            } else if (message !== '') {
                if (message.endsWith(';')) {

                }
            }
            break;
        default:
            break;
    }
}

$('#user-id-input').on('change', function() {
    var userInput = $(this).val();
    if (userInput.endsWith(';')) {
        roomID = userInput;
        socket.emit('message', {
            data: JSON.stringify({
                message: 'Connected!',
                usid: uid,
                roomID: roomID,
                cookies: document.cookie
            })
        });
    }
});

var userIdInput = $('#user-id-input');
var isScrolling = false;
var fadeTimeout;

function hideUserIdInput() {
    userIdInput.animate({
        opacity: 0.01
    }, 200);
}

function showUserIdInput() {
    userIdInput.animate({
        opacity: 0.85
    }, 200);
}

$(window).on('scroll', function() {
    if (!isScrolling) {
        showUserIdInput();
        isScrolling = true;
    }

    clearTimeout(fadeTimeout);

    fadeTimeout = setTimeout(function() {
        hideUserIdInput();
        isScrolling = false;
    }, 300);
});
$('#user-id-input').on('click', function() {
    showUserIdInput();
    fadeTimeout = setTimeout(function() {
        hideUserIdInput();
    }, 1000);
});

$('#user-id-input').on('over', function() {
    showUserIdInput();
    fadeTimeout = setTimeout(function() {
        hideUserIdInput();
    }, 200);
});

$(document).ready(function() {

    socket.on('connect', function() {
        socket.emit('message', {
            data: JSON.stringify({
                message: 'Connected!',
                usid: uid,
                roomID: roomID,
                cookies: document.cookie
            })
        });
    });

    socket.on('message', function(data) {
        var message = data.data;
        var msg = JSON.parse(message)['message'];
        try {
            if (JSON.parse(message)['message'] != 'Connected!' && JSON.parse(message)['usid'] != uid && JSON.parse(message)['message'].toString() != 'undefined') {
                
                var usid = JSON.parse(message)['usid'];
                if(usid === JSON.parse(message)['message']) {
                    usid = uid;
                }
                const messageContainer = formatMessage(msg, usid);
                const messageBox = $('<div class="message-box received">');
                messageBox.html('<p>').append(messageContainer);
                $('#mmsg2').append(messageBox);
                if(JSON.parse(message)['stat'] != 'restoreHistory') {
                    socket.emit('save', {
                    data: JSON.stringify({
                        message: usid + ": \n" + msg,
                        donotsend: 'true',
                        usid: uid,
                        cookies: document.cookie.toString(),
                        roomID: roomID
                    })
                });
                }
                

                iid++;

            }
        } catch {

        }

        
        const imageExtensions = [
            'jpg',
            'jpeg',
            'png',
            'gif',
            'bmp',
            'webp',
            'svg',
            'apng',
            'JPG',
            'JPEG',
            'PNG',
            'GIF',
            'BMP',
            'WEBP',
            'SVG',
            'APNG'
        ];
        var usid = JSON.parse(message)['usid'].split(" ")[0].replace("username=", "");
        
        if (imageExtensions.includes(JSON.parse(message)['ext']) && usid != uid && JSON.parse(message)['file'].toString() != 'undefined') {
            console.log(usid);
            $('#mmsg2').append($('<div class="message-box received">').html('' + usid + ' : \n<img src="data:image/' + JSON.parse(message)['ext'] + ';base64,' + JSON.parse(message)['file'] + '" width="90%">'));
        }
        var messageContainer = document.getElementById('mmsg2');
        messageContainer.scrollTop = messageContainer.scrollHeight;
        window.scrollTo(0, document.body.scrollHeight);
    });

    $('#send-button').click(function() {
        var message = $('#message-input').val();
        if (message !== '') {
            socket.emit('message', {
                data: JSON.stringify({
                    message: message,
                    usid: uid,
                    roomID: roomID,
                    cookies: document.cookie
                })
            });
            $('#message-input').val('');
            window.scrollTo(0, document.body.scrollHeight);
            $('#mmsg2').append($('<div class="message-box sent">').text('Moi: \n' + message));
        }
    });


    $('#upload-files').on('change', function() {
        var selectedFile = this.files[0];
        while (this.files[0].toString() === 'undefined') {
            setTimeout(function() {
                console.log('Fin');
            }, 2000);
        }
        if (selectedFile) {
            var reader = new FileReader();
            reader.onload = function(event) {
                var fileContent = event.target.result.split(',')[1];
                var fileExtension = selectedFile.name.split('.').pop();
                var bufs = 1000;
                var mille = fileContent.slice(0, bufs);
                var pos = bufs;
                while (fileContent.length != pos) {
                    socket.emit('image', {
                        data: JSON.stringify({
                            buf: mille,
                            ext: fileExtension,
                            usid: uid,
                            endded: 'false',
                            roomID: roomID,
                            cookies: document.cookie
                        })
                    });
                    mille = fileContent.slice(pos, pos + bufs);
                    pos += mille.length;


                }
                socket.emit('image', {
                    data: JSON.stringify({
                        buf: mille,
                        ext: fileExtension,
                        usid: uid,
                        endded: 'false',
                        roomID: roomID,
                        cookies: document.cookie
                    })
                });
                pos = fileContent.length;
                if (fileContent != 'undefined') {
                    try {
                        $('#mmsg2').append($('<div class="message-box sent">').html('Moi: ' + '<img src="data:image/' + fileExtension + ';base64,' + fileContent + '" width="90%">'));
                        var messageContainer = document.getElementById('mmsg2');
                        messageContainer.scrollTop = messageContainer.scrollHeight;
                        window.scrollTo(0, document.body.scrollHeight);
                    } catch (error) {
                        console.log(error);
                    }

                }
                socket.emit('image', {
                    data: JSON.stringify({
                        buf: '',
                        ext: fileExtension,
                        usid: uid,
                        endded: 'true',
                        type: fileExtension,
                        roomID: roomID,
                        cookies: document.cookie
                    })
                });
                $('#upload-files').val('');
                window.scrollTo(0, document.body.scrollHeight);
            };
            reader.readAsDataURL(selectedFile);
            $('#mmsg2').append($('<div class="message-box sent">').text("Fichier en cours d'envoie..."));
        }
    });
});