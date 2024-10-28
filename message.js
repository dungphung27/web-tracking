//1: người giám sát
//0: người được giám sát
const chatButton = document.getElementById('chat-button');
        const chatBox = document.getElementById('chat-box');
        let isClosing = false;
        let chatHeader = document.getElementById("chat-header")
        let chatNoti = document.getElementById("notification")
        chatHeader.onclick= (()=>{
            if (isClosing) return;
            if (chatBox.classList.contains('open')) {
                // Close with smooth animation
                chatBox.classList.add('closing');
                isClosing = true;
                setTimeout(() => {
                    chatBox.classList.remove('open', 'closing');
                    isClosing = false;
                }, 400); // Time matches the transition duration
            } else {
                // Open chat box
                chatBox.classList.add('open');
            }
        })
        
        const sendButton = document.getElementById('send-button');
        const messageInput = document.getElementById('message-input');
        const chatMessages = document.getElementById('chat-messages');
        let messageElements = Array.from(document.getElementsByClassName('message'))
       
        chatMessages.addEventListener('click',e =>{
            console.log(e)
        })
        function toggle_time()
        {
        messageElements.forEach(message =>{
            let timeElement = message.querySelector(".time")
            message.onclick = (() =>{
                console.log(timeElement.style.display)
                if(timeElement.style.display != "block")
                timeElement.style.display = "block";
                else
                timeElement.style.display = "none";
            })
        })
        }
        // receiveMessage("111")
        function getTime(text) {
    return new Promise((resolve) => {
        // Mô phỏng độ trễ xử lý thời gian, có thể bỏ qua nếu không cần
        setTimeout(() => {
            const time = new Date();
            let hours = time.getHours().toString().padStart(2, '0');
            let minutes = time.getMinutes().toString().padStart(2, '0');
            let day = time.getDate();
            let month = time.getMonth() + 1;
            let year = time.getFullYear();

            const timeStr = `${hours}:${minutes} ${day}/${month}/${year}`;
            resolve({
                type: 1,
                id: 0,
                value: text,
                time: {
                    hours: hours,
                    minutes: minutes,
                    day: day,
                    month: month,
                    year: year,
                },
                timeStr: timeStr
            });
        }, 100); // Có thể điều chỉnh thời gian đợi nếu cần, ở đây chỉ là ví dụ
    });
}

async function get_index_time(text) {
    let messageText;
    if (text) {
        messageText = await getTime(text);
    } else {
        messageText = await getTime(messageInput.value);
    }
    return messageText;
}

async function sendMessage(text,type) {
    let messageText =  text
    console.log(messageText.timeStr)
    if (messageText.value.trim() !== '') {
        const newMessage = document.createElement('div');
        console.log(typeof(type))
        if (type == 1)
        {
        newMessage.classList.add('message', 'sent');
        }
        else
        {
            newMessage.classList.add('message', 'received');
        }
        newMessage.innerHTML = `<p class="text">${messageText.value}</p><span class="time">${messageText.timeStr}</span>`;
        chatMessages.appendChild(newMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        // Trigger slide-in animatio
        setTimeout(() => {
            newMessage.style.animation = 'slideIn 0.3s forwards';
        }, 10);
        messageElements.push(newMessage);
        console.log(messageElements.length)
        messageInput.value = ''
        toggle_time()
    }
}
        // Ensure chat scrolls to bottom when opened
        chatBox.addEventListener('transitionend', () => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });