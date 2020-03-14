<template>
    <div id="app">
        <form
          v-if="!hasLogin"
          @submit="saveName(name)"
        >
            <div class="online">{{status}}</div>
            <input class="inputName" v-model="name"
                   required
                   autocomplete="off"
                   placeholder="name"
                   maxlength="10"
            >
        </form>

        <template v-else>
            <div @click="rename" class="rename">Rename</div>

            <div class="scores">
                <div v-for="num in scores"
                     class="score"
                     :class="{'score__voted': num === score}"
                     @click="clickOnScore(num)"
                >{{num}}
                </div>
            </div>

            <div class="user-list">
                <div v-for="user in users"
                     class="user"
                     :class="{'user__me': user.name === name}"
                >
                    <span v-show="adminMode"
                          @click="removeUser(user.name)"
                          class="clean">X
                    </span>
                    <div class="user__name" @click="resetScore">{{user.name}}</div>
                    <div class="user__score" @click="resetScore">
                        <span v-if="isShowScore(user.name)">{{user.score}}</span>
                        <span v-else-if="user.score > 0">V</span>
                    </div>
                </div>
            </div>
        </template>

    </div>
</template>

<script>
const ws = new WebSocket('ws://localhost:3000');
const defaultClick = 5;
let idTimeout;
const SesName = 'SPName';

export default {
    name: 'App',
    data() {
        return {
            hasLogin: '',
            name: '',
            score: 0,
            status: 'OFFLINE',
            users: [],
            scores: [0.5, 1, 2, 3, 5, 8, 12, 21],
            adminMode: false,
            clickToAdminMode: defaultClick,
        }
    },
    computed: {
        isAllVoted() {
            return !this.users.find(i => !i.score);
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
            this.score = num;
            this.send({command: 'setScore'});
        },
        saveName(name) {
            if (!this.name || this.findUserByName(this.name)) {
                return;
            }
            this.name = name;
            this.hasLogin = true;
            sessionStorage.setItem(SesName, this.name);
            this.send({command: 'saveName'});
        },
        restoreUser() {
            let name = sessionStorage.getItem(SesName);
            if (!name) {
                return;
            }
            this.name = name;
            this.hasLogin = true;
            this.saveName(name);
            this.send({command: 'saveName'});
        },
        findUserByName(name) {
            return this.users.find(i => i.name === name);
        },
        removeUser(name) {
            this.send({command: 'removeUser', name});
        },
        resetScore() {
            this.send({command: 'setScore', score: 0});
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
            }, 2000)
        },
        isShowScore(name) {
            return this.isAllVoted || name === this.name;
        },
    },
    created() {

        ws.onmessage = response => {
            let data = JSON.parse(response.data);
            console.log('onmessage', data);
            this.users = data;
        };

        ws.onopen = () => {
            this.restoreUser();
            this.setStatus('online');
        };
        ws.onclose = () => this.setStatus('stop');

        document.body.addEventListener('click', this.adminModeActivator);
    }
};
</script>