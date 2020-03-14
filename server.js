const WebSocket = require('ws');
const server = new WebSocket.Server({port: 3000});

let users = [];

server.on('connection', ws => {
    ws.on('message', message => {
        server.clients.forEach(client => {
            if(client.readyState === WebSocket.OPEN) {
                let data = JSON.parse(message);
                let user = findUserByName(data.name);

                console.log('data', data);

                if (data.command === 'connect') {
                    console.log('connect');
                }else if (data.command === 'removeUser') {
                    console.log('removeUser');
                    removeUser(data.name);
                } else if (user) {
                    console.log('change score');
                    user.score = data.score;
                } else {
                    console.log('add user');
                    users.push(data);
                }

                console.log('users', users);
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