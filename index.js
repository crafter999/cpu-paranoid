"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class CpuParanoid {
    constructor(options) {
        this.options = null;
        this.oldValues = null;
        this._percentage = 0;
        this.history = [];
        this.options = options;
        // init stabilizer
        for (let i = 0; i < this.options.stabilizer; i++) {
            this.history.push(1);
        }
    }
    get percentage() {
        return this._percentage.toFixed(2);
    }
    set percentage(v) {
        this._percentage = v;
    }
    async tick() {
        let procStat = await fs.promises.readFile("/proc/stat");
        let getFirstLine = procStat.toString().trim().split("\n")[0];
        let columns = getFirstLine.trim().split(" ");
        let user = parseInt(columns[2]);
        let nice = parseInt(columns[3]);
        let system = parseInt(columns[4]);
        let idle = parseInt(columns[5]);
        let iowait = parseInt(columns[6]);
        let irq = parseInt(columns[7]);
        let softirq = parseInt(columns[8]);
        let steal = parseInt(columns[9]);
        let guest = parseInt(columns[10]);
        let guest_nice = parseInt(columns[11]);
        return {
            totalIdle: idle + iowait,
            totalNonIdle: user + nice + system + irq + softirq + steal + guest + guest_nice,
        };
    }
    stabilizer(value) {
        this.history.shift();
        this.history.push(value);
        let average = 0;
        for (let v of this.history) {
            average += v;
        }
        // console.log(this.history);
        return average / this.history.length;
    }
    async startMonitoring() {
        this.oldValues = await this.tick();
        setInterval(async () => {
            const newValues = await this.tick();
            const diffIdle = newValues.totalIdle - this.oldValues.totalIdle;
            const diffTotal = (newValues.totalIdle + newValues.totalNonIdle) -
                (this.oldValues.totalNonIdle + this.oldValues.totalIdle);
            let p = (1000 * (diffTotal - diffIdle) / diffTotal + 8) / 10;
            if (p >= 100) {
                p = 100;
            }
            this.percentage = this.stabilizer(p);
            this.oldValues = newValues;
        }, this.options.updateInterval);
    }
}
exports.CpuParanoid = CpuParanoid;
//# sourceMappingURL=index.js.map