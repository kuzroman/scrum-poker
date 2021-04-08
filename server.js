const WebSocket = require('ws');
const { webSocketPort } = require('./config.js');
const server = new WebSocket.Server({port: webSocketPort});
let users = [];

server.on('connection', ws => {
    ws.on('message', message => {
        server.clients.forEach(client => {
            if(client.readyState === WebSocket.OPEN) {
                let data = JSON.parse(message);
                let user = findUserByName(data.name);
                if (data.command === 'removeUser') {
                    removeUser(data.name);
                } else if (user) {
                    user.score = data.score;
                } else {
                    users.push(data);
                }
                client.send(JSON.stringify(users));
            }
        })
    });
    ws.send(JSON.stringify(users));
});

function findUserByName(name) {
    return users.find(i => i.name === name);
}
function removeUser(name) {
    users = users.filter(function(obj) {
        return obj.name !== name;
    });
}