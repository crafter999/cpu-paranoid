import * as fs from "fs";

interface IOptions {
   /**
    * Set the fetching data frequency from /proc/stat.
    * Use values bigger than 100 ms for better stability.
    */
   updateInterval: number;
   /**
    * Controls the average result value based on how many values should be considered.
    * Sometimes your CPU may reach 90% in less than 10 milliseconds so this is where stabilizer
    * comes in play and based on the previous values from the history it will find the right average value.
    * If you want for example instant results use low stability values like 5.
    */
   stabilizer: number;
}

interface ITick {
   totalIdle: number;
   totalNonIdle: number;
}

export class CpuParanoid {
   private readonly options: IOptions;
   private oldValues: ITick = { totalIdle: 0, totalNonIdle: 0 };
   private _percentage: number = 0;
   private history: Array<number> = [];

   /** Get the magic value */
   get percentage() {
      return this._percentage.toFixed(2);
   }

   set percentage(v: any) {
      this._percentage = v;
   }

   constructor(options: IOptions) {
      this.options = options;

      // init stabilizer
      for (let i = 0; i < this.options.stabilizer; i++) {
         this.history.push(1);
      }
   }

   private async tick(): Promise<ITick> {
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

   private stabilizer(value: number): number {
      this.history.shift();
      this.history.push(value);
      let average: number = 0;
      for (let v of this.history) {
         average += v;
      }

      // console.log(this.history);
      return average / this.history.length;
   }

   /** Start monitor for changes in an infinite loop.**/
   public async startMonitoring() {
      this.oldValues = await this.tick();

      setInterval(async () => {
         const newValues = await this.tick();
         const diffIdle = newValues.totalIdle - this.oldValues.totalIdle;
         const diffTotal = (newValues.totalIdle + newValues.totalNonIdle) -
            (this.oldValues.totalNonIdle + this.oldValues.totalIdle);
         let p = diffTotal > 0 ? (1000 * (diffTotal - diffIdle) / diffTotal + 8) / 10 : 0;
         
         if (p >= 100) {
            p = 100;
         }
         this.percentage = this.stabilizer(p);
         this.oldValues = newValues;
      }, this.options.updateInterval);
   }
}
