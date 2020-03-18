<template>
    <div id="app">
        <div class="online" :class="{red: isOffline}">{{status}}</div>

        <form
          v-if="!hasLogin"
          @submit.prevent="saveName(lobby, name)"
        >
            <label for="lobby">
                <input class="inputName" v-model="lobby"
                       required
                       autocomplete="off"
                       placeholder="number of lobby"
                       max="9999"
                       type="number"
                       id="lobby"
                       @input="inputLobby"
                />
            </label>
            <label for="name">
                <input class="inputName" v-model="name"
                       required
                       autofocus
                       autocomplete="off"
                       placeholder="yourName"
                       maxlength="10"
                       id="name"
                       @input="inputName"
                />
            </label>

            <input type="submit" style="position: absolute; left: -9999px"/>
        </form>

        <template v-else>
            <div @click="rename" class="rename">Rename</div>
            <div class="lobby">Lobby:{{lobby}}</div>

            <div class="scores">
                <div v-for="num in scores"
                     class="score"
                     :class="{'score__voted': num === score}"
                     @click="clickOnScore(num)"
                >{{num}}
                </div>
            </div>

            <div class="user-list">
                <div v-for="user in usersInLobby"
                     class="user"
                     :class="{'user__me': user.name === name}"
                >
                    <span v-show="adminMode"
                          @click="removeUser(user.name)"
                          class="clean">X
                    </span>
                    <div class="user__name">{{formattedSession(user.name, 'name')}}</div>
                    <div class="user__score">
                        <span v-if="isShowScore(user.name)">{{user.score}}</span>
                        <span v-else-if="user.score > 0">V</span>
                    </div>
                </div>
            </div>
        </template>

    </div>
</template>

<script>
const ws = new WebSocket(`ws://${IP}:3000`);
const defaultClick = 10;
let idTimeout;
const SesName = 'SPName';
const defaultConnection = 'OFFLINE';

export default {
    name: 'App',
    data() {
        return {
            hasLogin: '',
            lobby: null,
            name: '',
            score: 0,
            status: defaultConnection,
            users: [],
            scores: [0.5, 1, 2, 3, 5, 8, 13, 21, '?'],
            adminMode: false,
            clickToAdminMode: defaultClick,
        }
    },
    computed: {
        isAllVoted() {
            return !this.usersInLobby.find(i => !i.score);
        },
        usersInLobby() {
            return this.users.filter(i => this.lobby === this.formattedSession(i.name, 'lobby'));
        },
        isOffline() {
            return this.status === defaultConnection;
        },
    },
    methods: {
        rename() {
            this.removeUser(this.name);
            sessionStorage.removeItem(SesName);
            this.hasLogin = false;
            this.name = '';
        },
        setStatus(value) {
            this.status = value;
        },
        send(data) {
            ws.send(JSON.stringify(Object.assign({name: this.name, score: this.score}, data)));
        },
        clickOnScore(num) {
            this.score = this.score === num ? 0 : num;
            this.send({command: 'setScore'});
        },
        saveName(lobby, name) {
            name = lobby + '.' + name.trim();
            if (!lobby || !name || this.findUserByName(name)) {
                return;
            }
            this.name = name;
            this.hasLogin = true;
            sessionStorage.setItem(SesName, this.name);
            this.send({command: 'saveName'});
        },
        restoreSession() {
            let sessionName = sessionStorage.getItem(SesName);
            if (!sessionName) {
                return;
            }
            let lobby = this.formattedSession(sessionName, 'lobby');
            let name = this.formattedSession(sessionName, 'name');
            if (!lobby || !name) {
                return;
            }
            this.name = name;
            this.lobby = lobby;
            this.hasLogin = true;
            this.saveName(lobby, name);
            this.send({command: 'saveName'});
        },
        formattedSession(user, param) {
            let splitted = user.split('.');
            if (param === 'name') {
                return splitted[1] ? splitted[1] : 'OpsName';
            } else if (param === 'lobby') {
                return splitted[0] ? splitted[0] : 'OpsLobby';
            }
        },
        findUserByName(name) {
            return this.users.find(i => i.name === name);
        },
        removeUser(name) {
            this.send({command: 'removeUser', name});
        },
        adminModeActivator() {
            this.clickToAdminMode--;
            if (this.clickToAdminMode < 0) {
                this.adminMode = true;
            }
            clearTimeout(idTimeout);
            if (this.adminMode) {
                return;
            }
            idTimeout = setTimeout(() => {
                this.clickToAdminMode = defaultClick;
            }, 500)
        },
        isShowScore(name) {
            return this.isAllVoted || name === this.name;
        },
        inputName() {
            this.name = this.name.replace(/[^a-zA-Zа-я]+/g, '');
        },
        inputLobby() {
            if (this.lobby.length > 4) {
                this.lobby = this.lobby.slice(0,4);
            }
        },
    },
    created() {

        ws.onmessage = response => {
            this.users = JSON.parse(response.data);
        };

        ws.onopen = () => {
            this.restoreSession();
            this.setStatus('Online');
        };
        ws.onclose = () => this.setStatus(defaultConnection);

        document.body.addEventListener('click', this.adminModeActivator);
    }
};
</script>
